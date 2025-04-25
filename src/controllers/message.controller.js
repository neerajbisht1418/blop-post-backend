// controllers/messageController.js
const { Message, Chat } = require('../models/chat.model');
const User = require('../models/user.model');

exports.sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).send({ message: "Invalid data passed into request" });
  }
  try {
    let newMessage = {
      sender: req.user.userId,
      content: content,
      chat: chatId,
    };

    let message = await Message.create(newMessage);

    message = await message.populate("sender", "name email");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

exports.allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email")
      .populate("chat");

    res.json(messages);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    );

    if (!message) {
      return res.status(404).send({ message: "Message not found" });
    }

    res.status(200).json(message);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).send({ message: "Message not found" });
    }

    // Check if the user is the sender of the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(401).send({ message: "Not authorized" });
    }

    await Message.findByIdAndDelete(messageId);
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};