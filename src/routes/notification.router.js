const express = require('express');
const Notification = require('../models/notification');
const userAuth = require('../middlewares/auth');

const notificationRouter = express.Router();

// GET my notifications (paged, newest first)
notificationRouter.get('/', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || '10', 10), 1),
      50
    );
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId }),
    ]);

    res.json({ ok: true, page, limit, total, items });
  } catch (err) {
    console.error('GET /notifications error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET unread count
// /notifications/unread/count
notificationRouter.get('/unread/count', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({ userId, isRead: false });
    res.json({ ok: true, count });
  } catch (err) {
    console.error('GET /notifications/unread/count error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//- PATCH /notfications/:id/read --> // Mark one as read
notificationRouter.patch('/:id/read', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!n) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, item: n });
  } catch (err) {
    console.error('PATCH /notifications/:id/read error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//- PATCH /notfications/read-all ---> // Mark all as read
notificationRouter.patch('/read-all', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ ok: true, message: 'All marked as read' });
  } catch (err) {
    console.error('PATCH /notifications/read-all error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = notificationRouter;
