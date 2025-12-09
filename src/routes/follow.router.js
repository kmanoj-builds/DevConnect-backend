const express = require('express');
const User = require('../models/user');
const Follow = require('../models/follow');
const userAuth = require('../middlewares/auth');

const followRouter = express.Router();

// follow someone
// POST - /follow/:userId
followRouter.post('/:userId', userAuth, async (req, res) => {
  try {
    //id's of me and target
    const me = req.user._id;
    const target = req.params.userId;

    //not able to follow your self
    if (String(me) === String(target)) {
      return res
        .status(400)
        .json({ ok: false, error: 'You cannot follow yourself' });
    }

    //update the follow model
    await Follow.updateOne(
      { followeId: me, followingId: target },
      { $setOnInsert: { followeId: me, followingId: target } },
      { upsert: true }
    );

    return res.json({ ok: true, message: 'Followed' });
  } catch (err) {
    //catch already followed -- and once again follow - dupilcate stop
    if (err?.code === 11000) {
      return res.json({ ok: true, message: 'Already following' });
    }
    console.error('POST /follow error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//unfollow
//DELETE - /follow/:userId
followRouter.delete('/:userId', userAuth, async (req, res) => {
  try {
    const me = req.user._id;
    const target = req.params.userId;
    await Follow.deleteOne({ followeId: me, followingId: target });
    return res.json({ ok: true, message: 'Unfollowed' });
  } catch (err) {
    console.error('DELETE /follow error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//Why i follow
//GET - /follow/following
followRouter.get('/following', userAuth, async (req, res) => {
  try {
    const me = req.user._id;
    // geting from Follow-Model --> in that who are i am following (followeId)
    const follows = await Follow.find({ followeId: me }).lean();
    //extracting following Id
    const ids = follows.map((f) => f.followingId);
    // users
    const users = await User.find({ _id: { $in: ids } })
      .select('firstName lastName')
      .lean();
    return res.json({ ok: true, count: users.length, users });
  } catch (err) {
    console.error('GET /follow/following error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//who follows me
//GET - /follow/followers
followRouter.get('/followers', userAuth, async (req, res) => {
  try {
    const me = req.user._id;
    const followers = await Follow.find({ followingId: me }).lean();
    const ids = followers.map((f) => f.followeId);
    const users = await User.find({ _id: { $in: ids } })
      .select('firstName lastName')
      .lean();
    return res.json({ ok: true, count: users.length, users });
  } catch (err) {
    console.error('GET /follow/followers error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = followRouter;
