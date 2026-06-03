const cron = require('node-cron');
const PregnancyProfile = require('../models/PregnancyProfile');
const pregnancyGuide = require('../data/pregnancyGuide');
const { notify } = require('../services/notificationService');

// Every Monday at 8am
cron.schedule('0 8 * * 1', async () => {
  try {
    const profiles = await PregnancyProfile.find({ active: true });
    for (const profile of profiles) {
      const week = Math.min(40, Math.floor((Date.now() - profile.lastMenstrualPeriod) / (7 * 24 * 60 * 60 * 1000)));
      await PregnancyProfile.findByIdAndUpdate(profile._id, { currentWeek: week });
      const guide = pregnancyGuide[week - 1];
      if (guide) {
        await notify(
          profile.user,
          'general',
          `🤰 Week ${week} Update`,
          guide.tips,
          { week, pregnancyProfileId: String(profile._id) }
        );
      }
    }
  } catch (err) {
    console.error('Pregnancy reminder cron error:', err.message);
  }
});
