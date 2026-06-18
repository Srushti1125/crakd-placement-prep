import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

const generateAccessToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
const generateRefreshToken = (payload) => jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });

export {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  generateAccessToken,
  generateRefreshToken
};
