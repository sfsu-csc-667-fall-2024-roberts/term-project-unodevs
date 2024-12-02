import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Express } from "express";
import flash from "express-flash";

// Configure the session store
const sessionStore = new (connectPgSimple(session))({
  createTableIfMissing: true,
});

// Define the session middleware
const sessionMiddleware = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "default_secret",
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
});

// Function to initialize session and flash middleware for Express
export function initializeSession(app: Express): void {
  app.use(sessionMiddleware);
  app.use(flash());
}

// Export session middleware as default
export default sessionMiddleware;
