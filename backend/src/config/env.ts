import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h" as const,
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12"),
  
  // Trust proxy configuration
  TRUST_PROXY: process.env.TRUST_PROXY || "auto", // "auto", "true", "false", or number
  
  // Email configuration
  EMAIL_HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || "587"),
  EMAIL_SECURE: process.env.EMAIL_SECURE === "true" || false,
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASS: process.env.EMAIL_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@mrmpg.com",
  COMPANY_NAME: process.env.COMPANY_NAME || "MRM PG Management",
  COMPANY_WEBSITE: process.env.COMPANY_WEBSITE || "https://mrmpg.com",
};
