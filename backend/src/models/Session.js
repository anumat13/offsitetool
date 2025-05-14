const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  sessionName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  submissionOpen: { type: Boolean, default: false }, // New field for submission status
  votingOpen: { type: Boolean, default: false },
  resultsPublished: { type: Boolean, default: false },
  // Submission timer fields
  submissionTimerEnabled: { type: Boolean, default: false },
  submissionTimerDuration: { type: Number }, // Duration in minutes
  submissionTimerEndTime: { type: Date }, // When the submission timer will end
  // Voting timer fields
  timerEnabled: { type: Boolean, default: false },
  timerDuration: { type: Number }, // Duration in minutes
  timerEndTime: { type: Date }, // When the timer will end
});

module.exports = mongoose.model('Session', SessionSchema);
