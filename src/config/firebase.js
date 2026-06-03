const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const rawKey = process.env.FCM_PRIVATE_KEY || '';
    const privateKey = rawKey
      .replace(/"/g, '')
      .replace(/\\n/g, '\n')
      .trim();

    if (process.env.FCM_PROJECT_ID && privateKey && process.env.FCM_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FCM_PROJECT_ID,
          privateKey,
          clientEmail: process.env.FCM_CLIENT_EMAIL,
        }),
      });
      console.log('Firebase initialized');
    } else {
      console.warn('Firebase credentials missing — push notifications disabled');
    }
  } catch (err) {
    console.warn('Firebase init failed — push notifications disabled:', err.message);
  }
}

module.exports = admin;
