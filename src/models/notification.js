const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }, // receiver
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }, // who did the action
    type: { type: String, enum: ['follow', 'like', 'comment'], required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // for like/comment
    commentId: { type: mongoose.Schema.Types.ObjectId }, // for comment
    isRead: { type: Boolean, default: false },
    meta: { type: Object, default: {} }, // optional extra info (snippet, etc.)
  },
  { timestamps: true }
);

// Useful indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
