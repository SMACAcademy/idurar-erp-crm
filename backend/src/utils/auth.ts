import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ENV } from "../config/env";
import { PgType } from "@prisma/client";

// JWT payload interface for Admin
export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  pgType: PgType;
  role: "admin";
  iat?: number;
  exp?: number;
}

// JWT payload interface for Member
export interface MemberJWTPayload {
  id: string;
  email: string;
  name: string;
  memberId: string;
  pgType: PgType;
  role: "member";
  iat?: number;
  exp?: number;
}

// Generate JWT token for admin
export const generateAdminToken = (payload: Omit<JWTPayload, 'iat' | 'exp' | 'role'>): string => {
  return jwt.sign({ ...payload, role: 'admin' }, ENV.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Generate JWT token for member
export const generateMemberToken = (payload: Omit<MemberJWTPayload, 'iat' | 'exp' | 'role'>): string => {
  return jwt.sign({ ...payload, role: 'member' }, ENV.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Generate JWT token (backward compatibility)
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Verify JWT token (admin)
export const verifyToken = (token: string): JWTPayload => {
  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET) as JWTPayload;
    if (payload.role !== 'admin') {
      throw new Error('Invalid token type');
    }
    return payload;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Verify JWT token (member)
export const verifyMemberToken = (token: string): MemberJWTPayload => {
  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET) as MemberJWTPayload;
    if (payload.role !== 'member') {
      throw new Error('Invalid token type');
    }
    return payload;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, ENV.BCRYPT_SALT_ROUNDS);
};

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Extract token from Authorization header
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer " prefix
};

// OTP Utilities
import crypto from "crypto";

// Generate secure 6-digit OTP
export const generateSecureOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// Hash OTP for secure storage
export const hashOTP = async (otp: string): Promise<string> => {
  return await bcrypt.hash(otp, ENV.BCRYPT_SALT_ROUNDS);
};

// Verify OTP against hashed version
export const verifyOTP = async (otp: string, hashedOTP: string): Promise<boolean> => {
  return await bcrypt.compare(otp, hashedOTP);
};
