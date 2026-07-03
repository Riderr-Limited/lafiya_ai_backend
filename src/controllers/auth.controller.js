const User = require("../models/User.model");
const { generateToken, generateRefreshToken } = require("../utils/jwt.utils");
const { generateRandomToken, hashToken } = require("../utils/token.utils");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/email.utils");
const AppError = require("../utils/AppError");

const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  res.status(statusCode).json({ success: true, message, token, refreshToken, user });
};

const sendErrorResponse = (res, error) => {
  const statusCode = error.statusCode || 500;
  const response = { success: false, message: error.message || "Server error" };
  if (error.errors) response.errors = error.errors;
  return res.status(statusCode).json(response);
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role, preferredLanguage } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return sendErrorResponse(res, new AppError("Email already registered", 400));

    const verificationToken = generateRandomToken();
    const hashedToken = hashToken(verificationToken);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: role === "doctor" ? "doctor" : "patient",
      preferredLanguage,
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: Date.now() + 24 * 60 * 60 * 1000, // 24h
    });

    sendVerificationEmail(user, verificationToken).catch((e) =>
      console.error("Email send failed:", e.message)
    );

    sendTokenResponse(user, 201, res, "Registration successful. Please verify your email.");
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const query = email ? { email } : { phone };

    const user = await User.findOne(query).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return sendErrorResponse(res, new AppError("Invalid email or phone or password", 401));
    }

    if (!user.isActive) return sendErrorResponse(res, new AppError("Your account has been deactivated", 401));

    user.lastSeen = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, "Login successful");
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

// POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    const hashed = hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpiry: { $gt: Date.now() },
    });
    if (!user) return sendErrorResponse(res, new AppError("Invalid or expired verification token", 400));

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, "Email verified successfully");
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return sendErrorResponse(res, new AppError("No account with that email", 404));

    const resetToken = generateRandomToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpiry = Date.now() + 60 * 60 * 1000; // 1h
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user, resetToken);

    res.status(200).json({ success: true, message: "Password reset email sent" });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const hashed = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpiry: { $gt: Date.now() },
    });
    if (!user) return sendErrorResponse(res, new AppError("Invalid or expired reset token", 400));

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, "Password reset successful");
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.comparePassword(currentPassword))) {
      return sendErrorResponse(res, new AppError("Current password is incorrect", 401));
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, "Password changed successfully");
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

// POST /api/auth/refresh-token
exports.refreshToken = async (req, res) => {
  try {
    const jwt = require("jsonwebtoken");
    const { refreshToken } = req.body;
    if (!refreshToken) return sendErrorResponse(res, new AppError("No refresh token", 401));

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return sendErrorResponse(res, new AppError("User not found", 401));

    const newToken = generateToken(user._id);
    res.status(200).json({ success: true, token: newToken });
  } catch (error) {
    return sendErrorResponse(res, new AppError("Invalid refresh token", 401));
  }
};

// PUT /api/auth/update-fcm-token
exports.updateFcmToken = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { fcmToken: req.body.fcmToken });
    res.status(200).json({ success: true, message: "FCM token updated" });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};