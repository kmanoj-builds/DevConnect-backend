// Model for storing follow/unfollow

const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    followeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Follow", followSchema);