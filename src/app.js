const express = require('express');
const connectDB = require('./config/database');
const cookieParser = require('cookie-parser');
const cors = require('cors');

//routes
const authRouter = require('./routes/auth.router');
const profileRouter = require('./routes/profile.router');
const postRouter = require("./routes/post.router");
const followRouter = require('./routes/follow.router');
const notificationRouter = require('./routes/notification.router');

const app = express();

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

connectDB()
  .then(() => {
    console.log('Databasse connection established...');
    app.listen(process.env.PORT || 3000, () => {
      console.log(
        'Server is successfully listening on port ' +
          (process.env.PORT || 3000) +
          '...'
      );
    });
  })
  .catch((err) => {
    console.log(err);
    console.log('Database cannot be connected!!');
  });
