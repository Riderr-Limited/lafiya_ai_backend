const admin = require('../config/firebase');
const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async (userId, type, title, body, data = {}) => {
  return Notification.create({ user: userId, type, title, body, data });
};

const sendPush = async (userId, title, body, data = {}) => {
  try {
    if (!admin.apps.length) return;
    const user = await User.findById(userId).select('fcmToken');
    if (!user?.fcmToken) return;
    await admin.messaging().send({
      token: user.fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
  } catch (err) {
    console.error('FCM push error:', err.message);
  }
};

exports.notify = async (userId, type, title, body, data = {}) => {
  await Promise.all([
    createNotification(userId, type, title, body, data),
    sendPush(userId, title, body, data),
  ]);
};

exports.createNotification = createNotification;

exports.sendMulticast = async (tokens, title, body, data = {}) => {
  if (!tokens.length || !admin.apps.length) return;
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));
  for (const chunk of chunks) {
    try {
      await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      });
    } catch (err) {
      console.error('Multicast error:', err.message);
    }
  }
};
