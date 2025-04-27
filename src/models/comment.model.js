// src/models/comment.model.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient lookup of comments by post
commentSchema.index({ post: 1, createdAt: -1 });

// Index for efficient lookup of replies
commentSchema.index({ parent: 1, createdAt: -1 });

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parent',
  options: { sort: { createdAt: 1 } },
});

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;