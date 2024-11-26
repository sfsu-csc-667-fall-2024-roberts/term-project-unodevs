/// <reference path="../types/session.d.ts" />
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import httpErrors from "http-errors";
import morgan from "morgan";
import * as path from "path";

// Import routes
import * as routes from "./routes/index";
import * as configuration from "./config";
import authenticationMiddleware from "./middleware/authentication";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session (make sure this is done before using sessions)
configuration.configureSession(app);

// Middleware to check if user is logged in
app.use((req, res, next) => {
  res.locals.loggedIn = !!req.session.user; // true if user is in session, false otherwise
  next();
});

// Set the view engine to EJS
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

// Serve static files from 'src/server/static'
app.use(express.static(path.join(process.cwd(), 'src', 'server', 'static')));

// Redirect root to homepage
app.get("/", (req, res) => {
  res.redirect("/home");
});

// Mount routes
app.use("/home", routes.homepage, authenticationMiddleware);
app.use("/game", authenticationMiddleware, routes.game);
app.use("/", routes.authentication);
app.use("/lobby", authenticationMiddleware, routes.lobby);
app.use("/waitingroom", routes.waitingRoom);
app.use("/test", routes.test);

// Catch 404 and forward to error handler
app.use((_request, _response, next) => {
  next(httpErrors(404));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
