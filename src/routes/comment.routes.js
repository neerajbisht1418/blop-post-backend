
// src/routes/comment.routes.js
const express = require('express');
const commentController = require('../controllers/comment.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post(
  '/post/:postId',
  auth,
  commentController.createComment
);

router.get(
  '/post/:postId',
  commentController.getPostComments
);

router.get(
  '/:commentId/replies',
  commentController.getCommentReplies
);

router.put(
  '/:commentId',
  auth,
  commentController.updateComment
);

router.delete(
  '/:commentId',
  auth,
  commentController.deleteComment
);

router.post(
  '/:commentId/like',
  auth,
  commentController.toggleLikeComment
);

module.exports = router;
