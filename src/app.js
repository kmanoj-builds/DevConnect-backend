const path = require('path');
const express = require('express');
const connectDB = require('./config/database');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { notFound, errorHandler } = require('./middlewares/error');

//routes
const authRouter = require('./routes/auth.router');
const profileRouter = require('./routes/profile.router');
const postRouter = require('./routes/post.router');
const followRouter = require('./routes/follow.router');
const notificationRouter = require('./routes/notification.router');
const uploadRouter = require('./routes/upload.router');
const messageRouter = require('./routes/message.router');

const app = express();

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// simple root + health + db-status (handy for checks)
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'devconnect-api',
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});
app.get('/health', (_req, res) => res.json({ ok: true, status: 'healthy' }));
app.get('/db-status', (_req, res) => {
  const s = mongoose.connection.readyState; // 0,1,2,3
  res.json({
    ok: s === 1,
    status:
      ['disconnected', 'connected', 'connecting', 'disconnecting'][s] ||
      'unknown',
    host: mongoose.connection.host || null,
    db: mongoose.connection.name || null,
  });
});

//middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

//use routes
app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/posts', postRouter);
app.use('/follow', followRouter);
app.use('/notifications', notificationRouter);
app.use('/upload', uploadRouter);
app.use('/messages', messageRouter);

app.use(notFound); // must be after routes
app.use(errorHandler); // must be the last

connectDB()
  .then(() => {
    console.log('Databasse connection established...');
    app.listen(process.env.PORT || 4000, () => {
      console.log(
        'Server is successfully listening on port ' +
          (process.env.PORT || 4000) +
          '...'
      );
    });
  })
  .catch((err) => {
    console.log(err);
    console.log('Database cannot be connected!!');
  });

module.exports = app;
