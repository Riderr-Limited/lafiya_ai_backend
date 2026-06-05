const User = require("../models/User.model");
const AppError = require("../utils/AppError");
const { uploadFile, deleteFile } = require("../utils/cloudinary.utils");
const { paginate, getPaginationMeta } = require("../utils/pagination.utils");

// GET /api/users/profile
exports.getMyProfile = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

// PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      "firstName", "lastName", "phone", "dateOfBirth", "gender",
      "location", "preferredLanguage", "healthConditions", "emergencyContact",
      "isAnonymousMode", "anonymousName",
    ];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: "Profile updated", user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/avatar
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError("Please upload an image", 400));

    // Delete old avatar from Cloudinary
    if (req.user.avatar) {
      const publicId = req.user.avatar.split("/").pop().split(".")[0];
      await deleteFile(`healthcommunity/avatars/${publicId}`).catch(() => {});
    }

    const result = await uploadFile(req.file.path, "healthcommunity/avatars");
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.url },
      { new: true }
    );

    res.status(200).json({ success: true, message: "Avatar updated", avatar: user.avatar });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-emailVerificationToken -passwordResetToken"
    );
    if (!user) return next(new AppError("User not found", 404));
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// GET /api/users  (admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isVerified } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === "true";
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const { skip, limit: lim } = paginate(null, page, limit);
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(lim).sort("-createdAt"),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: getPaginationMeta(total, page, lim),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/me
exports.deleteMyAccount = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.status(200).json({ success: true, message: "Account deactivated successfully" });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/me/communities
exports.getMyCommunities = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("communities");
    res.status(200).json({ success: true, communities: user.communities });
  } catch (error) {
    next(error);
  }
};