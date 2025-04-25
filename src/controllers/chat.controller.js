// controllers/chatController.js
const { Chat, Message } = require('../models/chat.model');
const User = require('../models/user.model');

exports.accessChat = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).send({ message: "UserId param not sent with request" });
  }

  if (userId === req.user.userId.toString()) {
    return res.status(400).send({ message: "Cannot create chat with yourself" });
  }

  try {
    const otherUser = await User.findById(userId).select('name');

    if (!otherUser) {
      return res.status(404).send({ message: "User not found" });
    }

    let existingChat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [req.user.userId, userId] }
    })
      .sort({ createdAt: -1 })
      .populate("users", "-password")
      .populate("latestMessage");


    if (existingChat) {
      return res.send(existingChat);
    }

    const chatData = {
      chatName: `${req.user.name} & ${otherUser.name}`,
      isGroupChat: false,
      users: [req.user.userId, userId],
    };

    const createdChat = await Chat.create(chatData);

    const fullChat = await Chat.findOne({ _id: createdChat._id })
      .populate("users", "-password");

    res.status(200).send(fullChat);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Server error occurred"
    });
  }
};

exports.fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user.userId } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    const results = await User.populate(chats, {
      path: "latestMessage.sender",
      select: "name email",
    });

    res.status(200).send(results);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

exports.createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }

  let users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  users.push(req.user._id);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

exports.renameGroup = async (req, res) => {
  const { chatId, chatName } = req.body;

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      res.status(404).send({ message: "Chat Not Found" });
    } else {
      res.json(updatedChat);
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

exports.addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const added = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!added) {
      res.status(404).send({ message: "Chat Not Found" });
    } else {
      res.json(added);
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

exports.removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const removed = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!removed) {
      res.status(404).send({ message: "Chat Not Found" });
    } else {
      res.json(removed);
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};