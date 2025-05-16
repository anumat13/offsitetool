console.log('[DEBUG] app.js: Script start');
const express = require('express');
console.log('[DEBUG] app.js: Express required');
const mongoose = require('mongoose');
console.log('[DEBUG] app.js: Mongoose required');
const cors = require('cors');
console.log('[DEBUG] app.js: CORS required');
const path = require('path');
console.log('[DEBUG] app.js: Path required');
const http = require('http'); 
console.log('[DEBUG] app.js: HTTP required');
const { Server } = require("socket.io"); 
console.log('[DEBUG] app.js: Socket.IO Server required');
const dotenv = require('dotenv');
console.log('[DEBUG] app.js: Dotenv required');
dotenv.config();
console.log('[DEBUG] app.js: dotenv.config() called');

const logger = require('./logger');
console.log('[DEBUG] app.js: Logger required');

const app = express();
console.log('[DEBUG] app.js: Express app initialized');
const PORT = process.env.PORT || 4000;
console.log(`[DEBUG] app.js: PORT is ${PORT}`);

// Middleware for logging requests
app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.originalUrl, body: req.body, ip: req.ip });
    next();
});
console.log('[DEBUG] app.js: Request logging middleware configured');

const allowedOrigins = [
  process.env.FRONTEND_URL_BASE, // Your Vercel URL from env
  'https://offsitetool.vercel.app', // Production Vercel URL
  'https://offsitetool-git-development-anumat13.vercel.app', // Development branch Vercel URL
  'http://localhost:3000',       // Default for local React dev server
  'http://localhost:3001',       // Another common local port
  // Add any other specific origins you need to allow
].filter(Boolean); // Filter out undefined/null if FRONTEND_URL_BASE is not set

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // If you need to handle cookies or authorization headers
};

app.use(cors(corsOptions)); // Apply specific CORS options
console.log('[DEBUG] app.js: General CORS middleware configured');

// MongoDB Connection
console.log('[DEBUG] app.js: Attempting MongoDB connection...');
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('[DEBUG] app.js: MongoDB connected successfully (via console.log)');
    logger.info('MongoDB connected successfully.');
  })
  .catch(err => {
    console.error('[DEBUG] app.js: MongoDB connection error (via console.error):', err.message);
    logger.error('MongoDB connection error:', { error: err.message, stack: err.stack });
  });

// Models
console.log('[DEBUG] app.js: Defining/Requiring Models...');
const Admin = require('./models/Admin');
const Session = require('./models/Session');
const Team = require('./models/Team');
const Vote = require('./models/Vote');
console.log('[DEBUG] app.js: Models required');

const bcrypt = require('bcrypt');
console.log('[DEBUG] app.js: Bcrypt required');
const jwt = require('jsonwebtoken');
console.log('[DEBUG] app.js: JWT required');

// Middleware for JSON body parsing
app.use(express.json());
console.log('[DEBUG] app.js: express.json() middleware configured');

// Basic route
app.get('/', (req, res) => {
  res.send('Icebreaker backend is running!');
});
console.log('[DEBUG] app.js: Basic / route configured');

// Admin: Delete session and all data
app.delete('/api/admin/session/:id', async (req, res) => {
  const { id } = req.params;
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  try {
    jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
  await Promise.all([
    Session.deleteOne({ _id: id }),
    Team.deleteMany({ sessionId: id }),
    Vote.deleteMany({ sessionId: id })
  ]);
  res.json({ message: 'Session and all related data deleted.' });
});
console.log('[DEBUG] app.js: Admin delete session route configured');

// Admin: End session (set inactive)
app.patch('/api/admin/session/:id/end', async (req, res) => {
  const { id } = req.params;
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  try {
    jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
  const session = await Session.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!session) return res.status(404).json({ message: 'Session not found' });
  res.json({ message: 'Session ended.', session });
});
console.log('[DEBUG] app.js: Admin end session route configured');

// Admin: Get last 5 active sessions
app.get('/api/admin/sessions/recent', async (req, res) => {
  try {
    const sessions = await Session.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).limit(5);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch sessions' });
  }
});
console.log('[DEBUG] app.js: Admin recent sessions route configured');

// Admin: Get all sessions (active and inactive)
app.get('/api/admin/sessions/all', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch sessions' });
  }
});
console.log('[DEBUG] app.js: Admin all sessions route configured');

// Admin login route
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});
console.log('[DEBUG] app.js: Admin login route configured');

// Get session info by ID
app.get('/api/session/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json({ session });
  } catch (err) {
    logger.error({ message: err.message, stack: err.stack, route: '/api/session/:id', params: req.params });
    res.status(500).json({ message: 'Could not fetch session' });
  }
});
console.log('[DEBUG] app.js: Session info route configured');

// Admin create session route
app.post('/api/admin/session', async (req, res) => {
  try {
    const { sessionName } = req.body;
    // Simple auth: require valid JWT in Authorization header
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'No token' });
    try {
      jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }
    // Set all other sessions inactive
    await Session.updateMany({ isActive: true }, { isActive: false });
    const session = new Session({ sessionName, isActive: true });
    await session.save();
    res.json({ session });
  } catch (err) {
    logger.error({ message: err.message, stack: err.stack, route: '/api/admin/session', body: req.body });
    res.status(500).json({ message: 'Could not create session' });
  }
});
console.log('[DEBUG] app.js: Admin create session route configured');

// Admin: Get session details by ID (for admin UI)
app.get('/api/admin/session/:sessionId/details', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json({ session });
  } catch (err) {
    logger.error({ message: err.message, stack: err.stack, route: '/api/admin/session/:sessionId/details', params: req.params });
    res.status(500).json({ message: 'Could not fetch session details' });
  }
});
console.log('[DEBUG] app.js: Admin session details route configured');

// Team submission route
app.post('/api/team/submit', async (req, res) => {
  try {
    const { teamName, teamMembers, personaCard, mdbCardUsed, aiCardUsed, wildCardUsed, productTitle, solution } = req.body;
    if (!teamName || !teamMembers || !solution) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Accept comma-separated or array for teamMembers
    let finalTeamMembers = teamMembers;
    if (typeof teamMembers === 'string') {
      finalTeamMembers = teamMembers.split(',').map(m => m.trim()).filter(Boolean);
    }
    if (!Array.isArray(finalTeamMembers) || finalTeamMembers.length === 0) {
      return res.status(400).json({ message: 'Team members must be a non-empty array.' });
    }
    // Find the active session
    const session = await Session.findOne({ isActive: true });
    if (!session) {
      return res.status(400).json({ message: 'No active session found. Please ask the admin to create one.' });
    }
    // console.log('Creating team:', { sessionId: session._id, teamName, teamMembers: finalTeamMembers, personaCard, mdbCardUsed, aiCardUsed, wildCardUsed, solution });
    const team = new Team({
      sessionId: session._id,
      teamName,
      teamMembers: finalTeamMembers,
      personaCard,
      mdbCardUsed,
      aiCardUsed,
      wildCardUsed,
      productTitle,
      solution,
    });
    await team.save();
    res.json({ message: 'Submission received', team });
  } catch (err) {
    console.error('Error submitting team:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});
console.log('[DEBUG] app.js: Team submission route configured');

// List all teams in a session
app.get('/api/session/:sessionId/teams', async (req, res) => {
  const { sessionId } = req.params;
  let session;
  try {
    session = await Session.findById(sessionId);
  } catch {
    return res.status(404).json({ message: 'Session not found' });
  }
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }
  const teams = await Team.find({ sessionId });
  res.json({ teams });
});
console.log('[DEBUG] app.js: Teams in session route configured');

// Admin: Open/close submissions with optional timer
app.post('/api/admin/session/:sessionId/submission', async (req, res) => {
  const { sessionId } = req.params;
  const { submissionOpen, timerDuration } = req.body;
  
  // Simple auth: require valid JWT in Authorization header
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  try {
    jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  // Prepare update data
  const updateData = { submissionOpen };
  
  // If timer duration is provided and submission is being opened, set up the timer
  if (submissionOpen && timerDuration && timerDuration > 0) {
    const submissionTimerEndTime = new Date();
    submissionTimerEndTime.setMinutes(submissionTimerEndTime.getMinutes() + parseInt(timerDuration));
    updateData.submissionTimerEnabled = true;
    updateData.submissionTimerDuration = parseInt(timerDuration);
    updateData.submissionTimerEndTime = submissionTimerEndTime;
  } else if (!submissionOpen) {
    // If submission is being closed, disable the timer
    updateData.submissionTimerEnabled = false;
    updateData.submissionTimerEndTime = null;
  }
  
  const session = await Session.findByIdAndUpdate(sessionId, updateData, { new: true });
  if (!session) return res.status(404).json({ message: 'Session not found' });
  
  let message = `Submission ${submissionOpen ? 'opened' : 'closed'}`;
  if (submissionOpen && timerDuration && timerDuration > 0) {
    message += ` with a ${timerDuration} minute timer`;
  }
  
  res.json({ message, session });
});
console.log('[DEBUG] app.js: Admin submission route configured');

// Admin: Open/close voting with optional timer
app.post('/api/admin/session/:sessionId/voting', async (req, res) => {
  const { sessionId } = req.params;
  const { votingOpen, timerDuration } = req.body;
  
  // Simple auth: require valid JWT in Authorization header
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token' });
  try {
    jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  // Prepare update data
  const updateData = { votingOpen };
  
  // If opening voting, ensure submissions are closed
  if (votingOpen === true) {
    updateData.submissionOpen = false;
    // Optionally, could also clear submission timer fields here if necessary
    // e.g., updateData.submissionTimerEnabled = false; updateData.submissionTimerEndTime = null;
    // However, simply closing submissions might be sufficient, and the submission timer UI
    // on the frontend should react to submissionOpen being false.
  }
  
  // If timer duration is provided and voting is being opened, set up the timer
  if (votingOpen && timerDuration && timerDuration > 0) {
    const timerEndTime = new Date();
    timerEndTime.setMinutes(timerEndTime.getMinutes() + parseInt(timerDuration));
    updateData.timerEnabled = true;
    updateData.timerDuration = parseInt(timerDuration);
    updateData.timerEndTime = timerEndTime;
  } else if (!votingOpen) {
    // If voting is being closed, disable the timer
    updateData.timerEnabled = false;
    updateData.timerEndTime = null;
  }
  
  const session = await Session.findByIdAndUpdate(sessionId, updateData, { new: true });
  if (!session) return res.status(404).json({ message: 'Session not found' });
  
  let message = `Voting ${votingOpen ? 'opened' : 'closed'}`;
  if (votingOpen && timerDuration && timerDuration > 0) {
    message += ` with a ${timerDuration} minute timer`;
  }
  
  res.json({ message, session });
});
console.log('[DEBUG] app.js: Admin voting route configured');

// Admin: Publish/unpublish results
app.post('/api/admin/session/:sessionId/results', async (req, res) => {
  const { sessionId } = req.params;
  const { resultsPublished } = req.body;
  const session = await Session.findByIdAndUpdate(sessionId, { resultsPublished }, { new: true });
  if (!session) return res.status(404).json({ message: 'Session not found' });
  res.json({ message: `Results ${resultsPublished ? 'published' : 'unpublished'}`, session });
});
console.log('[DEBUG] app.js: Admin results route configured');

// Results for a session
app.get('/api/session/:sessionId/results', async (req, res) => {
  const { sessionId } = req.params;
  let session;
  try {
    session = await Session.findById(sessionId);
  } catch {
    return res.status(404).json({ message: 'Session not found' });
  }
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }
  const teams = await Team.find({ sessionId }).sort({ totalVotes: -1 });
  if (teams.length === 0) {
    return res.json({ teams: [], winners: [] });
  }
  const maxVotes = teams[0].totalVotes;
  const winners = teams.filter(t => t.totalVotes === maxVotes && maxVotes > 0);
  res.json({ teams, winners });
});
console.log('[DEBUG] app.js: Session results route configured');

// Voting route
app.post('/api/vote', async (req, res) => {
  try {
    const { sessionId, voterName, voterTeam, votedForTeamId } = req.body;
    // Check voting is open
    let session;
    try {
      session = await Session.findById(sessionId);
    } catch {
      return res.status(403).json({ message: 'Voting is not open for this session.' });
    }
    if (!session || !session.votingOpen) {
      return res.status(403).json({ message: 'Voting is not open for this session.' });
    }
    
    // Validate voter information
    if (!voterName || !voterTeam) {
      return res.status(400).json({ message: 'Voter name and team are required' });
    }
    
    // Check if the voter is trying to vote for their own team
    const votingForOwnTeam = await Team.findOne({ 
      sessionId: new mongoose.Types.ObjectId(sessionId), 
      teamName: voterTeam,
      _id: votedForTeamId 
    });
    
    if (votingForOwnTeam) {
      return res.status(400).json({ message: 'Cannot vote for your own team' });
    }
    
    // Check if this voter has already voted
    const alreadyVoted = await Vote.findOne({ 
      sessionId: new mongoose.Types.ObjectId(sessionId), 
      voterName: voterName,
      voterTeam: voterTeam
    });
    
    if (alreadyVoted) {
      return res.status(400).json({ message: 'You have already voted in this session' });
    }
    
    // Register vote
    const vote = new Vote({ 
      sessionId: new mongoose.Types.ObjectId(sessionId), 
      voterName, 
      voterTeam, 
      votedForTeamId 
    });
    await vote.save();
    
    // Increment totalVotes for voted team
    await Team.findByIdAndUpdate(votedForTeamId, { $inc: { totalVotes: 1 } });
    res.json({ message: 'Vote submitted' });
  } catch (err) {
    console.error('Error submitting vote:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});
console.log('[DEBUG] app.js: Voting route configured');

// Admin: Get metrics for a specific session
app.get('/api/admin/sessions/:sessionId/metrics', async (req, res) => {
  const { sessionId } = req.params;

  // JWT Authentication
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided or token is malformed' });
  }
  try {
    jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET);
  } catch (err) {
    logger.warn({ message: 'Invalid token for metrics endpoint', error: err.message, sessionId });
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const submittedTeamsCount = await Team.countDocuments({ sessionId: sessionId });
    const totalVotesCast = await Vote.countDocuments({ sessionId: sessionId });

    res.json({ submittedTeamsCount, totalVotesCast });

  } catch (err) {
    logger.error({
      message: 'Error fetching session metrics',
      error: err.message,
      stack: err.stack,
      route: '/api/admin/sessions/:sessionId/metrics',
      sessionId
    });
    res.status(500).json({ message: 'Could not fetch session metrics' });
  }
});
console.log('[DEBUG] app.js: Admin metrics route configured');

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../frontend/build'))); 
console.log(`[DEBUG] app.js: Serving static files from ${path.join(__dirname, '../../frontend/build')}`);

// Catch-all for serving index.html for client-side routing in SPA
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) { // Do not serve index.html for API routes
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'), (err) => {
      if (err) {
          logger.warn(`Error sending index.html: ${err.message}. Request path: ${req.path}`);
          if (!res.headersSent) {
              res.status(500).send('Error loading application.');
          }
      }
    });
  } else {
    // If it's an API route not handled by now, it's a 404 for the API
    logger.warn(`Unhandled API route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  }
});
console.log('[DEBUG] app.js: Catch-all * route configured');

// Global error handler (example, customize as needed)
app.use((err, req, res, next) => {
  console.error('[DEBUG] app.js: Global error handler caught an error (via console.error):', err.message);
  logger.error({ message: 'Global error handler caught an error', error: err.message, stack: err.stack, url: req.originalUrl });
  if (!res.headersSent) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
console.log('[DEBUG] app.js: Global error handler configured');

// HTTP server and Socket.IO setup
console.log('[DEBUG] app.js: Creating HTTP server...');
const server = http.createServer(app); // Create HTTP server with Express app
console.log('[DEBUG] app.js: HTTP server created. Initializing Socket.IO...');

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      console.log(`[DEBUG] app.js: Socket.IO CORS check for origin: ${origin}`);
      if (!origin) return callback(null, true); 
      const allowedOriginPattern = /^http:\/\/(localhost|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):(3000|4000)$/;
      const frontendBase = process.env.FRONTEND_URL_BASE; 

      if (allowedOriginPattern.test(origin) || (frontendBase && origin.startsWith(frontendBase))) {
        console.log(`[DEBUG] app.js: Socket.IO CORS allowed for origin: ${origin}`);
        return callback(null, true);
      } else {
        console.warn(`[DEBUG] app.js: Socket.IO CORS denied for origin: ${origin} (via console.warn)`);
        logger.warn(`Socket.IO CORS denied for origin: ${origin}`);
        return callback(new Error('Not allowed by CORS for Socket.IO'));
      }
    },
    methods: ["GET", "POST"]
  }
});
console.log('[DEBUG] app.js: Socket.IO server initialized');

io.on('connection', (socket) => {
  console.log(`[DEBUG] app.js: User connected via WebSocket: ${socket.id} (via console.log)`);
  logger.info('A user connected via WebSocket:', { socketId: socket.id });
  socket.on('disconnect', () => {
    console.log(`[DEBUG] app.js: User disconnected via WebSocket: ${socket.id} (via console.log)`);
    logger.info('User disconnected via WebSocket:', { socketId: socket.id });
  });
  // Example: socket.on('adminUpdate', (data) => { io.emit('sessionUpdated', data); });
});

// Start the server
console.log('[DEBUG] app.js: Attempting to start server.listen()...');
server.listen(PORT, () => {
  console.log(`[DEBUG] app.js: server.listen() callback executed. Server running on port ${PORT} (via console.log).`);
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Backend available at http://localhost:${PORT} and on your LAN IP at port ${PORT}`);
  logger.info(`Frontend (if built and served by this backend) likely at http://localhost:${PORT}`);
  logger.info(`If frontend is on dev server (e.g., http://localhost:3000), ensure its origin is allowed by CORS.`);
});
console.log('[DEBUG] app.js: Script end (synchronous part)');
