const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  teamName: { type: String, required: true }, // not unique
  teamMembers: [String],
  personaCard: String,
  mdbCardUsed: String,
  aiCardUsed: String,
  wildCardUsed: String,
  productTitle: String, // Product title field
  solution: String,
  submissionTimestamp: { type: Date, default: Date.now },
  totalVotes: { type: Number, default: 0 },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
});

module.exports = mongoose.model('Team', TeamSchema);
