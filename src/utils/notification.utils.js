const Notification = require("../models/Notification.model");
const { sendPushNotification } = require("../config/firebase");

const createNotification = async ({ recipient, sender, type, title, body, data, link }) => {
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    title,
    body,
    data,
    link,
  });
  return notification;
};

const notifyUser = async (io, userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }
};

module.exports = { createNotification, sendPushNotification, notifyUser };