
// src/models/post.model.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    coverImage: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true,
});

postSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;