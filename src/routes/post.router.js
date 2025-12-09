//routes of Posts

const express = require('express');
const User = require('../models/user');
const Post = require('../models/post');
const Follow = require('../models/follow');
const Notification = require('../models/notification');
const userAuth = require('../middlewares/auth');

// Creating the router for Post
const postRouter = express.Router();

// helper function
function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// route for creating a Post
postRouter.post('/', userAuth, async (req, res) => {
  try {
    // getting the user
    const userId = req.user._id;

    // getting the content and image of a post
    const content = (req.body?.content || '').toString().trim();
    const images = asArray(req.body?.images);

    if (!content) {
      return res.status(400).json({ ok: false, error: 'Content is required' });
    }

    // Creating a post
    const post = await Post.create({ userId, content, images });

    // send response
    return res.status(201).json({ ok: true, post });
  } catch (err) {
    console.error('POST /posts error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// posts from only who following
// GET - /posts/feed
postRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const me = req.user._id;
    const page  = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
    const skip  = (page - 1) * limit;

    const follows = await Follow.find({ followerId: me }).select("followingId").lean();
    const followingIds = follows.map(f => f.followingId);

    if (!followingIds.length) {
      return res.json({ ok: true, page, limit, total: 0, items: [] });
    }

    const [items, total] = await Promise.all([
      Post.find({ userId: { $in: followingIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({ userId: { $in: followingIds } })
    ]);

    return res.json({ ok: true, page, limit, total, items });
  } catch (err) {
    console.error("GET /posts/feed error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

//list of posts -- public feeds
postRouter.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || '10', 10), 1),
      50
    );
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;

    const [items, total] = await Promise.all([
      Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments(filter),
    ]);

    const userIds = [...new Set(items.map((p) => String(p.userId)))];
    const users = await User.find({ _id: { $in: userIds } })
      .select('firstName lastName')
      .lean();

    const userMap = Object.fromEntries(users.map((u) => [String(u._id, u)]));

    const withAuthor = items.map((p) => ({
      ...p,
      author: userMap[String(p.userId)] || null,
    }));

    return res.json({ ok: true, page, limit, total, items: withAuthor });
  } catch (err) {
    console.error('GET /posts error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET /posts/:postId
postRouter.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).lean();
    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post not found' });
    }

    const author = await User.findById(post.userId)
      .select('firstName lastName')
      .lean();
    return res.json({ ok: true, post: { ...post, author: author || null } });
  } catch (err) {
    console.error('GET /posts/:postId error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Edit my POST -- PATCH /posts/:postId
postRouter.patch('/:postId', userAuth, async (req, res) => {
  try {
    // postId --> to update the post
    const postId = req.params.postId;
    // user id
    const userId = req.user._id;

    // content, images -> to update
    const { content, images } = req.body;

    // find the post in DB
    const post = await Post.findById(postId);

    // not post present
    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post not dound' });
    }

    // check post->userId == logined user id
    if (String(post.userId) !== String(userId)) {
      return res.status(403).json({ ok: false, error: 'Not your post' });
    }

    // now update the fields
    if (typeof content === 'string') {
      post.content = content;
    }

    if (typeof images !== undefined) {
      post.images = asArray(images);
    }

    //Save in DB
    await post.save();

    return res.json({ ok: true, post });
  } catch (err) {
    console.error('PATCH /posts/:postId error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Delete my post -- DELETE /posts/:postId
postRouter.delete('/:postId', userAuth, async (req, res) => {
  try {
    //userId for authentication
    const userId = req.user._id;
    //post id
    const postId = req.params.postId;

    //finding that post in post Schema
    const post = await Post.findById(postId);

    // not post found
    if (!post) {
      return res.status(403).json({ ok: false, error: 'post not found' });
    }

    // checking postUserId == logined userId
    if (String(post.userId) !== String(userId)) {
      return res.status(403).json({ ok: false, error: 'Not your post' });
    }

    // deleting the post
    await post.deleteOne();
    // sending response
    return res.json({ ok: true, message: 'Post deleted' });
  } catch (err) {
    console.error('DELETE /posts/:postId error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// like/unlike toggle
// POST /posts/:postId/like
postRouter.post('/:postId/like', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;

    //finding the post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post not found' });
    }

    // finding that user is liking first time
    const idx = post.likes.findIndex((id) => String(id) === String(userId));

    //not like
    if (idx === -1) {
      // add the user to likes
      post.likes.push(userId);
      //save it
      await post.save();

      await Notification.create({
        userId: post.userId, // post owner
        actorId: userId, // liker
        type: 'like',
        postId: post._id,
        meta: { contentSnippet: post.content?.slice(0, 100) || '' },
      });

      return res.json({ ok: true, liked: true, likesCount: post.likes.length });
    }
    // already liked -- toggle
    else {
      post.likes.splice(idx, 1);
      await post.save();
      return res.json({
        ok: true,
        liked: false,
        likesCount: post.likes.length,
      });
    }
  } catch (err) {
    console.error('POST /posts/:postId/like error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Adding comment
// POST /posts/:postId/comment
postRouter.post('/:postId/comment', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;

    const text = (req.body.text || '').toString().trim();
    if (!text) {
      return res
        .status(400)
        .json({ ok: false, error: 'Comment Text is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post not found' });
    }

    post.comments.push({ userId, text });
    await post.save();

    if (String(post.userId) !== String(userId)) {
      await Notification.create({
        userId: post.userId, // post owner
        actorId: userId, // commenter
        type: 'comment',
        postId: post._id,
        commentId: post.comments[post.comments.length - 1]._id,
        meta: { textSnippet: text.slice(0, 100) },
      });
    }

    return res.status(201).json({
      ok: true,
      comments: post.comments,
      commentsCount: post.comments.length,
    });
  } catch (err) {
    console.error('POST /posts/:postId/comment error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

//Deleting comment
//DELETE -- /posts/:postId/comment/:commentId
// DELETE /api/v1/posts/:postId/comment/:commentId
postRouter.delete('/:postId/comment/:commentId', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ ok: false, error: 'Post not found' });

    // find the subdocument by its _id
    const comment = post.comments.id(commentId);
    if (!comment)
      return res.status(404).json({ ok: false, error: 'Comment not found' });

    // allow if current user is the post owner OR the comment author
    const isPostOwner = String(post.userId) === String(userId);
    const isCommentAuthor = String(comment.userId) === String(userId);

    if (!isPostOwner && !isCommentAuthor) {
      return res.status(403).json({ ok: false, error: 'Not allowed' });
    }

    // remove the comment and save
    comment.deleteOne(); // or post.comments.id(commentId).deleteOne()
    await post.save();

    return res.json({
      ok: true,
      message: 'Comment deleted',
      comments: post.comments,
      commentsCount: post.comments.length,
    });
  } catch (err) {
    console.error('DELETE /posts/:postId/comment/:commentId error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = postRouter;
