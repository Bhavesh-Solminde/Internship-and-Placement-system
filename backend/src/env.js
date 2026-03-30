import "dotenv/config";

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    console.error(`[ENV] Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
};

export const ENV = {
  NODE_ENV:       process.env.NODE_ENV || "development",
  PORT:           process.env.PORT || "5001",
  DATABASE_URL:   requireEnv("DATABASE_URL"),
  JWT_SECRET:     requireEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLIENT_URL:     process.env.CLIENT_URL || "http://localhost:5173",
  UPLOAD_DIR:     process.env.UPLOAD_DIR || "./uploads",
};
