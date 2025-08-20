import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const comparePasswords = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: string): string => {
  const payload = { userId };
  const secret = process.env.JWT_SECRET!;
  
  return jwt.sign(payload, secret, { expiresIn: 60 * 60 * 24 * 7 }); // 7 days in seconds
};

export const verifyToken = (token: string): { userId: string } | null => {
  try {
    const secret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
};