const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    members: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// each conversation is unique between two users
conversationSchema.index({ members: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
