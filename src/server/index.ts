import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import httpErrors from "http-errors";
import morgan from "morgan";
import * as path from "path";
import connectLiveReload from "connect-livereload";
import livereload from "livereload";

// Import routes
import gameRoutes from "./routes/Game";
import homepageRoutes from "./routes/Homepage";
import signInRoutes from "./routes/SignIn";
import signUpRoutes from "./routes/SignUp";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// LiveReload setup for development environment
const staticPath = path.join(process.cwd(), "src", "public");
if (process.env.NODE_ENV === "development") {
  const reloadServer = livereload.createServer();
  reloadServer.watch(staticPath);
  reloadServer.server.once("connection", () => {
    setTimeout(() => {
      reloadServer.refresh("/");
    }, 100);
  });
  app.use(connectLiveReload());
}

app.use(express.static(staticPath));

app.use(cookieParser());
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

// Redirect root to homepage
app.get("/", (req, res) => {
  res.redirect("/home");
});

// Mount routes
app.use("/home", homepageRoutes);
app.use("/game", gameRoutes);
app.use("/signin", signInRoutes);
app.use("/signup", signUpRoutes);

// Catch 404 and forward to error handler
app.use((_request, _response, next) => {
  next(httpErrors(404));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
