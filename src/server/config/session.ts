import connectPgSimple from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import flash from "express-flash";
import session, { Store } from "express-session";

// Initialize the session store
const sessionStore = new (connectPgSimple(session))({
  createTableIfMissing: true,
});

// Define the session configuration
const sessionConfig = session({
  store: sessionStore as Store,
  secret: process.env.SESSION_SECRET || "default_secret", // Use default if the environment variable is missing
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production", // Secure cookies in production
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
});

// Middleware to initialize sessions and flash messages
export const initializeSession = (app: Express): void => {
  app.use(sessionConfig);
  app.use(flash());
};

// Export session middleware for reuse (e.g., in Socket.IO)
export { sessionConfig };
