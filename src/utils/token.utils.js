const crypto = require("crypto");

const generateRandomToken = () => crypto.randomBytes(32).toString("hex");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = { generateRandomToken, hashToken };
