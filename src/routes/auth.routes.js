const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");

const registerRules = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginRules = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", ...registerRules, validate, authController.register);
router.post("/login", ...loginRules, validate, authController.login);
router.get("/me", protect, authController.getMe);
router.post("/verify-email", authController.verifyEmail);
router.post("/forgot-password", body("email").isEmail(), validate, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.put("/change-password", protect, authController.changePassword);
router.post("/refresh-token", authController.refreshToken);
router.put("/fcm-token", protect, authController.updateFcmToken);

module.exports = router;