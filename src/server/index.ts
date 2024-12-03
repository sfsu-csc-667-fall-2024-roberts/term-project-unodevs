/// <reference path="../types/session.d.ts" />
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import http from "http"; // Import the HTTP module
import { Server } from "socket.io"; // Import Socket.IO server
import httpErrors from "http-errors";
import morgan from "morgan";
import * as path from "path";

// Import routes and session configuration
import * as routes from "./routes/index";
import sessionMiddleware, { initializeSession } from "./config/session";
import authenticationMiddleware from "./middleware/authentication";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(httpServer);
app.set("io", io); // Make `io` accessible globally for routes and controllers

io.engine.use(sessionMiddleware); // Share session middleware with Socket.IO

io.on("connection", (socket) => {
  if (socket.handshake.query != undefined) {
    // join the game room
    socket.join(socket.handshake.query.id + "");
  }
  //join your own room
  socket.join(socket.request.session.id);
});

// Middleware setup
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
initializeSession(app); // Initialize session and flash middleware

// Middleware to check if the user is logged in
app.use((req, res, next) => {
  res.locals.loggedIn = !!req.session?.user;
  next();
});

// Set the view engine to EJS
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

// Serve static files
app.use(express.static(path.join(process.cwd(), "src", "server", "static")));

// Redirect root to homepage
app.get("/", (req, res) => {
  res.redirect("/home");
});

//Mount routes
app.use("/home", routes.homepage, authenticationMiddleware, routes.chat);
app.use("/game", authenticationMiddleware, routes.game, routes.chat);
app.use("/", routes.authentication);
app.use("/lobby", authenticationMiddleware, routes.lobby, routes.chat);
app.use("/waitingroom", routes.waitingRoom);
app.use("/test", routes.test);
app.use("/chat", authenticationMiddleware, routes.chat);
// Catch 404 and forward to error handler
app.use((_req, _res, next) => {
  next(httpErrors(404));
});

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
