const mongoose = require('mongoose');

const ApplicationStateSchema = new mongoose.Schema({
  currentStatus: { type: String, default: 'pending_start' },
  timerValue: { type: Number, default: 0 },
  timerRunning: { type: Boolean, default: false },
  winningTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
});

module.exports = mongoose.model('ApplicationState', ApplicationStateSchema);
