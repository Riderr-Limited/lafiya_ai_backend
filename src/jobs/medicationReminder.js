const cron = require('node-cron');
const Medication = require('../models/Medication');
const { notify } = require('../services/notificationService');

// Runs every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const meds = await Medication.find({ active: true, times: currentTime });
    for (const med of meds) {
      await notify(
        med.user,
        'medication_reminder',
        'Medication Reminder',
        `Time to take ${med.name}${med.dosage ? ` — ${med.dosage}` : ''}`,
        { medicationId: String(med._id) }
      );
    }
  } catch (err) {
    console.error('Medication reminder cron error:', err.message);
  }
});
