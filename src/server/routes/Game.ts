import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.render("game", { message: "Welcome to the Game Page!" });
});

export default router;
