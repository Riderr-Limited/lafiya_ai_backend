const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: `"HealthCommunity" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  };
  await transporter.sendMail(mailOptions);
};

// Pre-built email templates
const sendVerificationEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Verify Your Email - HealthCommunity",
    html: `
      <h2>Welcome to HealthCommunity, ${user.firstName}!</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${url}" style="background:#0ea5e9;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Password Reset - HealthCommunity",
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.firstName}, click the button below to reset your password:</p>
      <a href="${url}" style="background:#ef4444;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Reset Password</a>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `,
  });
};

const sendAppointmentConfirmation = async (patient, appointment, doctor) => {
  await sendEmail({
    to: patient.email,
    subject: "Appointment Confirmed - HealthCommunity",
    html: `
      <h2>Appointment Confirmed!</h2>
      <p>Hi ${patient.firstName}, your appointment has been confirmed.</p>
      <ul>
        <li><strong>Doctor:</strong> Dr. ${doctor.user.firstName} ${doctor.user.lastName}</li>
        <li><strong>Date:</strong> ${new Date(appointment.scheduledAt).toLocaleString()}</li>
        <li><strong>Type:</strong> ${appointment.type}</li>
      </ul>
    `,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendAppointmentConfirmation };