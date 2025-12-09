#Routes

#auth Routes
- POST /signup
- POST /login
- GET /logout

#Profile Routes
- POST /profile   --> Create/Update MY profile
- GET /profile/me --> GET My Profile
- GET /profile/:userId  --> public profile by :userId
- GET /profile      --> List/search profiles

#post Routes
- POST /posts --> Creating post
- GET /posts --> Getting posts (feed)
- GET /posts/:postId --> getting particular user's post
- PATCH /posts/:postId --> Editing the post
- DELETE /posts/:postId -> Deleting the post
- POST /posts/:postId/like --> like/unlike toggle
- POST /posts/:postId/comment --> Adding the comment
- DELETE /posts/:postId/comment/:commentId  --> Deleting the comment --> login user only can delete the comments...

- GET /posts/feed --> posts only from who i follow


#follow Routes
- POST /follow/:userId --> following a user
- DELETE /follow/userId --> unfollow 
- GET /follow/following --> who i follow
- GET /follow/followers --> who follows me
