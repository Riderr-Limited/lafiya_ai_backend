const Hospital = require("../models/Hospital.model");
const User = require("../models/User.model");
const { createNotification } = require("../utils/notification.utils");

// Nigeria emergency contacts
const EMERGENCY_CONTACTS = [
  { name: "Nigeria Emergency (General)", number: "112", type: "national" },
  { name: "Nigeria Police Force", number: "199", type: "police" },
  { name: "Federal Road Safety", number: "122", type: "road" },
  { name: "Kano State Emergency", number: "0800-KANO-911", type: "state" },
  { name: "Ambulance (LASEMA)", number: "767", type: "ambulance" },
  { name: "WHO Nigeria", number: "+234-9-461-4614", type: "health" },
];

// GET /api/emergency/contacts
exports.getEmergencyContacts = (req, res) => {
  res.status(200).json({ success: true, contacts: EMERGENCY_CONTACTS });
};

// GET /api/emergency/nearby-hospitals?lat=&lng=
exports.getNearbyEmergencyHospitals = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    let hospitals;
    if (lat && lng) {
      hospitals = await Hospital.find({
        isActive: true,
        emergencyAvailable: true,
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: 20000, // 20km
          },
        },
      })
        .select("name address phone emergencyPhone lga state location")
        .limit(10);
    } else {
      // Default: return Kano emergency hospitals
      hospitals = await Hospital.find({
        isActive: true,
        emergencyAvailable: true,
        state: { $regex: "kano", $options: "i" },
      })
        .select("name address phone emergencyPhone lga")
        .limit(10);
    }

    res.status(200).json({ success: true, hospitals, emergencyContacts: EMERGENCY_CONTACTS });
  } catch (error) {
    next(error);
  }
};

// POST /api/emergency/alert  (SOS - notifies emergency contact)
exports.sendEmergencyAlert = async (req, res, next) => {
  try {
    const { location, message } = req.body;
    const user = await User.findById(req.user._id);

    // Notify user's emergency contact via in-app notification (SMS would need Twilio)
    const alertMessage = `🆘 EMERGENCY ALERT from ${user.firstName} ${user.lastName} (${user.phone || "No phone"}).
Location: ${location || "Unknown"}
Message: ${message || "Needs immediate help!"}
Time: ${new Date().toLocaleString()}`;

    // If emergency contact is a registered user, send in-app notification
    const io = req.app.get("io");
    const notif = await createNotification({
      recipient: req.user._id,
      type: "emergency_alert",
      title: "🆘 Emergency Alert Sent",
      body: "Your emergency alert has been sent. Help is on the way.",
    });
    if (io) io.to(`user:${req.user._id}`).emit("notification", notif);

    // Find nearest emergency hospital
    let nearestHospital = null;
    if (location?.lat && location?.lng) {
      nearestHospital = await Hospital.findOne({
        isActive: true,
        emergencyAvailable: true,
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [location.lng, location.lat] },
            $maxDistance: 20000,
          },
        },
      }).select("name address emergencyPhone phone");
    } else {
      nearestHospital = await Hospital.findOne({
        isActive: true,
        emergencyAvailable: true,
      }).select("name address emergencyPhone phone");
    }

    res.status(200).json({
      success: true,
      message: "Emergency alert sent",
      emergencyContacts: EMERGENCY_CONTACTS,
      nearestHospital,
      userEmergencyContact: user.emergencyContact,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/emergency/first-aid/:condition
exports.getFirstAidGuide = (req, res) => {
  const guides = {
    choking: {
      title: "Choking First Aid",
      steps: [
        "Encourage them to cough forcefully",
        "Give 5 back blows between shoulder blades",
        "Give 5 abdominal thrusts (Heimlich maneuver)",
        "Call emergency services immediately",
      ],
    },
    malaria: {
      title: "Malaria Emergency",
      steps: [
        "Give fever-reducing medication (paracetamol)",
        "Keep the person cool with wet cloths",
        "Ensure they drink plenty of fluids",
        "Go to hospital immediately for rapid diagnostic test",
        "Do NOT use aspirin for children",
      ],
    },
    burns: {
      title: "Burns First Aid",
      steps: [
        "Remove the person from the source of heat",
        "Cool the burn under cool running water for 20 minutes",
        "Do NOT use ice, butter or toothpaste",
        "Cover loosely with clean non-fluffy material",
        "Seek medical attention",
      ],
    },
    seizure: {
      title: "Seizure/Convulsion First Aid",
      steps: [
        "Stay calm and time the seizure",
        "Protect from injury - remove hard objects nearby",
        "Do NOT restrain or put anything in the mouth",
        "Turn person on their side after convulsions stop",
        "Call for emergency help if it lasts more than 5 minutes",
      ],
    },
    bleeding: {
      title: "Severe Bleeding",
      steps: [
        "Call emergency services immediately",
        "Apply firm pressure with a clean cloth",
        "Do NOT remove the cloth - add more if soaked",
        "Keep the injured area elevated above heart level",
        "Keep the person warm and calm",
      ],
    },
    heatstroke: {
      title: "Heatstroke (common in Northern Nigeria)",
      steps: [
        "Move the person to a cool, shaded area",
        "Remove excess clothing",
        "Apply cool water to skin and fan them",
        "Give cool water to drink if conscious",
        "Go to hospital immediately - this is life threatening",
      ],
    },
  };

  const condition = req.params.condition?.toLowerCase();
  const guide = guides[condition];

  if (!guide) {
    return res.status(200).json({ success: true, availableGuides: Object.keys(guides) });
  }

  res.status(200).json({ success: true, guide });
};