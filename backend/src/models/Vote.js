const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  voterName: { type: String, required: true },
  voterTeam: { type: String, required: true },
  votedForTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  timestamp: { type: Date, default: Date.now },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
});

module.exports = mongoose.model('Vote', VoteSchema);
