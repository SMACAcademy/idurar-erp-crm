import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types/response";
import { verifyToken, verifyMemberToken as verifyMemberJWT, extractTokenFromHeader, JWTPayload, MemberJWTPayload } from "../utils/auth";

// Extended Request interface to include admin data
export interface AuthenticatedRequest extends Request {
  admin?: JWTPayload;
}

// Extended Request interface to include member data
export interface AuthenticatedMemberRequest extends Request {
  member?: MemberJWTPayload;
}

// Authentication middleware with JWT
export const authenticateAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "Authorization token is required",
      } as ApiResponse<null>);
    }

    // Verify JWT token
    const payload = verifyToken(token) as JWTPayload;

    // Verify it's an admin token (if role is present)
    if (payload.role && payload.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        error: "Admin authentication is required",
      } as ApiResponse<null>);
    }

    // Attach admin data to request
    req.admin = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      pgType: payload.pgType,
      role: "admin",
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: "Invalid or expired token",
    } as ApiResponse<null>);
  }
};

// Authorization middleware to ensure only admins can access admin operations
export const authorizeAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      error: "Admin authentication is required for this operation",
    } as ApiResponse<null>);
  }

  // Additional admin role checks can be added here
  next();
};

// User authentication middleware with JWT
export const authenticateUser = async (
  req: AuthenticatedMemberRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "Authorization token is required",
      } as ApiResponse<null>);
    }

    // Verify member JWT token
    const payload = verifyMemberJWT(token) as MemberJWTPayload;

    // Attach member data to request
    req.member = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      memberId: payload.memberId,
      pgType: payload.pgType,
      role: "member",
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: "Invalid or expired token",
    } as ApiResponse<null>);
  }
};
