// profile Router
// /profile/me

const express = require('express');
const Profile = require('../models/profile');
const userAuth = require('../middlewares/auth');
const { toSkills } = require('../utils/validation');

const profileRouter = express.Router();

// Create/Update MY profile
profileRouter.put('/', userAuth, async (req, res) => {
  try {
    //get the user -- by id
    const userId = req.user._id;

    //data
    const {
      bio = '',
      skills = '',
      avatarUrl = '',
      githubUrl = '',
      website = '',
      location = '',
    } = req.body || {};

    // store or update the data
    const update = {
      userId,
      bio: String(bio),
      skills: toSkills(skills),
      avatarUrl: String(avatarUrl),
      githubUrl: String(githubUrl),
      website: String(website),
      location: String(location),
    };

    // create or update the profile data -- by findOneAndUpdate
    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true }
    );

    // response
    res.json({ ok: true, message: 'Profile Saved', profile });
  } catch (err) {
    console.error('PUT /profile error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET My Profile
profileRouter.get('/me', userAuth, async (req, res) => {
  try {
    // get the user id from req
    const userId = req.user._id;

    //search in profile
    const profile = await Profile.findOne({ userId });

    // not found
    if (!profile) {
      return res.status(404).json({ ok: false, error: 'Profile not found' });
    }

    //send the response
    res.json({ ok: true, profile });
  } catch (err) {
    console.log('GET /profile/me error: ', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//public profile by :userId
profileRouter.get('/:userId', async (req, res) => {
  try {
    // get ._id from the params
    const { userId } = req.params;

    // search in the Profile -- Schema
    const profile = await Profile.findOne({ userId });

    // not found
    if (!profile) {
      return res.status(404).json({ ok: false, error: 'Profile not found' });
    }

    //send the response
    res.json({ ok: true, profile });
  } catch (err) {
    console.log('GET /profile/:userId error: ', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// 👉 List/search profiles: /profile?skill=react&q=chennai&page=1&limit=10
profileRouter.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || '10', 10), 1),
      50
    );
    const skip = (page - 1) * limit;

    const skill = (req.query.skill || '').toString().trim().toLowerCase();
    const q = (req.query.q || '').toString().trim();

    const filter = {};
    if (skill) filter.skills = skill;
    if (q)
      filter.$or = [
        { bio: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
      ];

    const [items, total] = await Promise.all([
      Profile.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Profile.countDocuments(filter),
    ]);

    res.json({ ok: true, page, limit, total, items });
  } catch (err) {
    console.error('GET /profile list error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = profileRouter;
