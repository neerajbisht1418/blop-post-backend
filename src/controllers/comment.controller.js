const Comment = require('../models/comment.model');
const Post = require('../models/post.model');
const ApiError = require('../utils/ApiError');

const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    const { userId } = req.user;

    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        throw new ApiError(404, 'Parent comment not found');
      }
      if (parentComment.post.toString() !== postId) {
        throw new ApiError(400, 'Parent comment does not belong to this post');
      }
    }

    const comment = await Comment.create({
      content,
      post: postId,
      author: userId,
      parent: parentId || null,
    });

    await comment.populate('author', 'name');

    res.status(201).json({
      status: 'success',
      message: parentId ? 'Reply added successfully' : 'Comment added successfully',
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

const getPostComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    };

    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    const comments = await Comment.find({ post: postId, parent: null })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const commentIds = comments.map(comment => comment._id);

    const replies = await Comment.find({ 
      parent: { $in: commentIds } 
    })
      .populate('author', 'name')
      .sort({ createdAt: 1 })
      .lean();

    const repliesByParent = {};
    replies.forEach(reply => {
      const parentId = reply.parent.toString();
      if (!repliesByParent[parentId]) {
        repliesByParent[parentId] = [];
      }
      repliesByParent[parentId].push(reply);
    });

    const commentsWithReplies = comments.map(comment => {
      const commentId = comment._id.toString();
      return {
        ...comment,
        replies: repliesByParent[commentId] || [],
      };
    });

    const total = await Comment.countDocuments({ post: postId, parent: null });

    res.status(200).json({
      status: 'success',
      data: {
        comments: commentsWithReplies,
        pagination: {
          total,
          page: options.page,
          limit: options.limit,
          pages: Math.ceil(total / options.limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCommentReplies = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: 1 },
    };

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    const replies = await Comment.find({ parent: commentId })
      .populate('author', 'name')
      .sort({ createdAt: 1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const total = await Comment.countDocuments({ parent: commentId });

    res.status(200).json({
      status: 'success',
      data: {
        replies,
        pagination: {
          total,
          page: options.page,
          limit: options.limit,
          pages: Math.ceil(total / options.limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const { userId } = req.user;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    if (comment.author.toString() !== userId.toString()) {
      throw new ApiError(403, 'You are not authorized to update this comment');
    }

    comment.content = content;
    await comment.save();

    await comment.populate('author', 'name');

    res.status(200).json({
      status: 'success',
      message: 'Comment updated successfully',
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { userId, role } = req.user;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    if (comment.author.toString() !== userId.toString() && role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to delete this comment');
    }

    await Promise.all([
      Comment.findByIdAndDelete(commentId),
      Comment.deleteMany({ parent: commentId }),
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const toggleLikeComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.user;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    const hasLiked = comment.likes.includes(userId);

    if (hasLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

    res.status(200).json({
      status: 'success',
      message: hasLiked ? 'Comment unliked successfully' : 'Comment liked successfully',
      data: { liked: !hasLiked, likeCount: comment.likes.length },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getPostComments,
  getCommentReplies,
  updateComment,
  deleteComment,
  toggleLikeComment,
};