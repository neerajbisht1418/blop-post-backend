const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const ApiError = require('../utils/ApiError');

const createPost = async (req, res, next) => {
    try {
        const { title, content, tags, coverImage, status } = req.body;
        const { userId } = req.user;

        const post = await Post.create({
            title,
            content,
            tags,
            coverImage,
            status,
            author: userId,
        });

        res.status(201).json({
            status: 'success',
            message: 'Post created successfully',
            data: { post },
        });
    } catch (error) {
        next(error);
    }
};

const getAllPosts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, tag, author } = req.query;
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sort: { createdAt: -1 },
            populate: { path: 'author', select: 'name' },
        };

        // Build filter criteria
        const filter = { status: 'published' };
        if (tag) filter.tags = tag;
        if (author) filter.author = author;

        // Execute query with pagination
        const posts = await Post.find(filter)
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .skip((options.page - 1) * options.limit)
            .limit(options.limit)
            .lean();

        // Get total count
        const total = await Post.countDocuments(filter);

        res.status(200).json({
            status: 'success',
            data: {
                posts,
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

const getPostById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id)
            .populate('author', 'name')
            .lean();

        if (!post) {
            throw new ApiError(404, 'Post not found');
        }

        // Get comment count
        const commentCount = await Comment.countDocuments({ post: id, parent: null });

        // Fetch latest 5 comments
        const comments = await Comment.find({ post: id, parent: null })
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.status(200).json({
            status: 'success',
            data: {
                post: {
                    ...post,
                    commentCount,
                    comments,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

const updatePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const { title, content, tags, coverImage, status } = req.body;

        const post = await Post.findById(id);

        if (!post) {
            throw new ApiError(404, 'Post not found');
        }

        // Check if user is the author
        if (post.author.toString() !== userId.toString()) {
            throw new ApiError(403, 'You are not authorized to update this post');
        }

        const updatedPost = await Post.findByIdAndUpdate(
            id,
            { title, content, tags, coverImage, status },
            { new: true }
        ).populate('author', 'name');

        res.status(200).json({
            status: 'success',
            message: 'Post updated successfully',
            data: { post: updatedPost },
        });
    } catch (error) {
        next(error);
    }
};

const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.user;

        const post = await Post.findById(id);

        if (!post) {
            throw new ApiError(404, 'Post not found');
        }

        // Check if user is the author or admin
        if (post.author.toString() !== userId.toString() && role !== 'admin') {
            throw new ApiError(403, 'You are not authorized to delete this post');
        }

        // Delete the post and its comments
        await Promise.all([
            Post.findByIdAndDelete(id),
            Comment.deleteMany({ post: id }),
        ]);

        res.status(200).json({
            status: 'success',
            message: 'Post deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

const toggleLikePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;

        const post = await Post.findById(id);

        if (!post) {
            throw new ApiError(404, 'Post not found');
        }

        // Check if user has already liked the post
        const hasLiked = post.likes.includes(userId);

        if (hasLiked) {
            // Unlike the post
            post.likes = post.likes.filter(
                (id) => id.toString() !== userId.toString()
            );
        } else {
            // Like the post
            post.likes.push(userId);
        }

        await post.save();

        res.status(200).json({
            status: 'success',
            message: hasLiked ? 'Post unliked successfully' : 'Post liked successfully',
            data: { liked: !hasLiked, likeCount: post.likes.length },
        });
    } catch (error) {
        next(error);
    }
};

const getUserPosts = async (req, res, next) => {
    try {
        const { userId } = req.user;
        const { page = 1, limit = 10, status } = req.query;

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sort: { createdAt: -1 },
        };

        // Build filter criteria
        const filter = { author: userId };
        if (status) filter.status = status;

        // Execute query with pagination
        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .skip((options.page - 1) * options.limit)
            .limit(options.limit)
            .lean();

        // Get total count
        const total = await Post.countDocuments(filter);

        res.status(200).json({
            status: 'success',
            data: {
                posts,
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

module.exports = {
    createPost,
    getAllPosts,
    getPostById,
    updatePost,
    deletePost,
    toggleLikePost,
    getUserPosts,
};
