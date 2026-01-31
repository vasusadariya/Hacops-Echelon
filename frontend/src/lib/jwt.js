import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    if (!token) {
      console.error('No token provided to verifyToken');
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully for user:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Token decode error:', error.message);
    return null;
  }
}