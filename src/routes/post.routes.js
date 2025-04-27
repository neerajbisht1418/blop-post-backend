// src/routes/post.routes.js
const express = require('express');
const postController = require('../controllers/post.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post(
  '/',
  auth,
  postController.createPost
);

router.get(
  '/',
  postController.getAllPosts
);

router.get(
  '/:id',
  postController.getPostById
);

router.put(
  '/:id',
  auth,
  postController.updatePost
);

router.delete(
  '/:id',
  auth,
  postController.deletePost
);

router.post(
  '/:id/like',
  auth,
  postController.toggleLikePost
);

router.get(
  '/user/me',
  auth,
  postController.getUserPosts
);

module.exports = router;
