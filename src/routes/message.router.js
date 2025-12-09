const express = require('express');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const User = require('../models/user');
const Profile = require('../models/profile');

const userAuth = require('../middlewares/auth');

const messageRouter = express.Router();

messageRouter.post('/:receiverId', userAuth, async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.receiverId;
    const text = (req.body?.text || '').trim();

    if (!text) {
      return res
        .status(400)
        .json({ ok: false, error: 'Message text required' });
    }

    if (senderId.equals(receiverId)) {
      return res
        .status(400)
        .json({ ok: false, error: 'Cannot message yourself' });
    }

    // find or create conversation between the two
    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    //create message
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      text,
    });

    return res.status(500).json({ ok: true, message });
  } catch (err) {
    console.error('POST /messages error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//- GET /messages/:userId     --> getting messages between me and you
messageRouter.get('/:userId', userAuth, async (req, res) => {
  try {
    const me = req.user._id;
    const other = req.params.userId;

    const conversation = await Conversation.findOne({
      members: { $all: [me, other], $size: 2 },
    });

    if (!conversation) {
      return res.json({ ok: true, messages: [] });
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ ok: true, conversationId: conversation._id, messages });
  } catch (err) {
    console.error('GET /messages/:userId error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//- GET /messages/list/all    --> list all my chats
// GET /api/v1/conversations/list/all
messageRouter.get('/list/all', userAuth, async (req, res) => {
  try {
    const me = req.user._id;

    // all conversations I’m part of
    const convs = await Conversation.find({ members: me })
      .sort({ updatedAt: -1 })
      .lean();

    // find the other participant for each conversation
    const partnerIds = convs
      .map((c) => c.members.find((id) => id.toString() !== me.toString()))
      .filter(Boolean);

    // fetch partner basic name from User
    const users = await User.find({ _id: { $in: partnerIds } })
      .select('firstName lastName')
      .lean();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

    // fetch avatar (and other public info) from Profile

    const profiles = await Profile.find({ userId: { $in: partnerIds } })
      .select('userId avatarUrl')
      .lean();
    const profileMap = Object.fromEntries(
      profiles.map((p) => [p.userId.toString(), p])
    );

    // combine into a clean list
    const list = convs.map((c) => {
      const partnerId = c.members
        .find((id) => id.toString() !== me.toString())
        .toString();
      const user = userMap[partnerId] || {};
      const prof = profileMap[partnerId] || {};
      return {
        _id: c._id,
        partner: {
          _id: partnerId,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          avatarUrl: prof.avatarUrl || '', // ✅ from Profile
        },
        lastUpdated: c.updatedAt,
      };
    });

    return res.json({ ok: true, conversations: list });
  } catch (err) {
    console.error('GET /conversations/list/all error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = messageRouter;
