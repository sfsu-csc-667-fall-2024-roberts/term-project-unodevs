/// <reference path="../types/session.d.ts" />
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import http from "http"; // Import the HTTP module
import { Server } from "socket.io"; // Import the Socket.IO server
import httpErrors from "http-errors";
import morgan from "morgan";
import * as path from "path";

// Import routes
import * as routes from "./routes/index";
import { initializeSession, sessionConfig } from "./config/session"; // Updated import
import authenticationMiddleware from "./middleware/authentication";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(httpServer);

// Attach session and flash middleware to Express
initializeSession(app);

// Share session configuration with Socket.IO
io.engine.use(sessionConfig);

// Attach the Socket.IO instance to the app for global use
app.set("io", io);

// Handle Socket.IO connections
io.on("connection", (socket) => {
  const session = socket.request.session; // Access the session from the socket
  if (session) {
    socket.join(session.id); // Use session ID as the room name
    console.log(`Socket connected: ${socket.id}, Session ID: ${session.id}`);
  } else {
    console.warn("No session found for socket");
  }
});

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware to check if user is logged in
app.use((req, res, next) => {
  res.locals.loggedIn = !!req.session?.user; // true if user is in session, false otherwise
  next();
});

// Set the view engine to EJS
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

// Serve static files from 'src/server/static'
app.use(express.static(path.join(process.cwd(), "src", "server", "static")));

// Redirect root to homepage
app.get("/", (req, res) => {
  res.redirect("/home");
});

// Mount routes
app.use("/home", routes.homepage, authenticationMiddleware, routes.chat);
app.use("/game", authenticationMiddleware, routes.game, routes.chat);
app.use("/", routes.authentication);
app.use("/lobby", authenticationMiddleware, routes.lobby, routes.chat);
app.use("/waitingroom", routes.waitingRoom);
app.use("/test", routes.test);
app.use("/chat", authenticationMiddleware, routes.chat);

// Catch 404 and forward to error handler
app.use((_request, _response, next) => {
  next(httpErrors(404));
});

// Start the server using HTTP server
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
