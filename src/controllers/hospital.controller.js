const Hospital = require("../models/Hospital.model");
const AppError = require("../utils/AppError");
const { paginate, getPaginationMeta } = require("../utils/pagination.utils");
const { uploadFile } = require("../utils/cloudinary.utils");

// GET /api/hospitals
exports.getAllHospitals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, state, lga, search, emergency, telemedicine } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (state) filter.state = { $regex: state, $options: "i" };
    if (lga) filter.lga = { $regex: lga, $options: "i" };
    if (emergency === "true") filter.emergencyAvailable = true;
    if (telemedicine === "true") filter.acceptsTelemedicine = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { services: { $regex: search, $options: "i" } },
      ];
    }

    const { skip, limit: lim } = paginate(null, page, limit);
    const [hospitals, total] = await Promise.all([
      Hospital.find(filter).skip(skip).limit(lim).sort("-rating"),
      Hospital.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: getPaginationMeta(total, page, lim),
      hospitals,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/hospitals/nearby?lat=&lng=&radius=
exports.getNearbyHospitals = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10000, emergency } = req.query; // radius in meters
    if (!lat || !lng) return next(new AppError("Latitude and longitude are required", 400));

    const filter = {
      isActive: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      },
    };
    if (emergency === "true") filter.emergencyAvailable = true;

    const hospitals = await Hospital.find(filter).limit(20);
    res.status(200).json({ success: true, hospitals });
  } catch (error) {
    next(error);
  }
};

// GET /api/hospitals/:id
exports.getHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return next(new AppError("Hospital not found", 404));
    res.status(200).json({ success: true, hospital });
  } catch (error) {
    next(error);
  }
};

// POST /api/hospitals  (admin)
exports.createHospital = async (req, res, next) => {
  try {
    const {
      name, type, address, lga, state, phone, email, website,
      services, specialties, emergencyAvailable, emergencyPhone,
      openingHours, insuranceProviders, acceptsTelemedicine,
      latitude, longitude,
    } = req.body;

    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadFile(file.path, "healthcommunity/hospitals");
        images.push(result.url);
      }
    }

    const hospital = await Hospital.create({
      name,
      type,
      address,
      lga,
      state,
      phone: Array.isArray(phone) ? phone : [phone],
      email,
      website,
      services: services ? (Array.isArray(services) ? services : JSON.parse(services)) : [],
      specialties: specialties ? (Array.isArray(specialties) ? specialties : JSON.parse(specialties)) : [],
      emergencyAvailable,
      emergencyPhone,
      openingHours: openingHours ? JSON.parse(openingHours) : {},
      insuranceProviders: insuranceProviders ? JSON.parse(insuranceProviders) : [],
      acceptsTelemedicine,
      images,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude || 0), parseFloat(latitude || 0)],
      },
    });

    res.status(201).json({ success: true, message: "Hospital created", hospital });
  } catch (error) {
    next(error);
  }
};

// PUT /api/hospitals/:id  (admin)
exports.updateHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!hospital) return next(new AppError("Hospital not found", 404));
    res.status(200).json({ success: true, message: "Hospital updated", hospital });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/hospitals/:id  (admin)
exports.deleteHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!hospital) return next(new AppError("Hospital not found", 404));
    res.status(200).json({ success: true, message: "Hospital deactivated" });
  } catch (error) {
    next(error);
  }
};

// POST /api/hospitals/:id/rate
exports.rateHospital = async (req, res, next) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return next(new AppError("Rating must be between 1 and 5", 400));

    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return next(new AppError("Hospital not found", 404));

    const newTotal = hospital.totalRatings + 1;
    const newRating = (hospital.rating * hospital.totalRatings + rating) / newTotal;
    hospital.rating = Math.round(newRating * 10) / 10;
    hospital.totalRatings = newTotal;
    await hospital.save();

    res.status(200).json({ success: true, newRating: hospital.rating });
  } catch (error) {
    next(error);
  }
};