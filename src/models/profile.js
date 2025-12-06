const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    bio: {
      type: String,
      default: '',
    },

    skills: [{ type: String, trim: true, lowercase: true }],

    avatarUrl: {
      type: String,
      default: '',
    },

    githubUrl: {
      type: String,
      default: '',
    },

    website: {
      type: String,
      default: '',
    },

    location: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
