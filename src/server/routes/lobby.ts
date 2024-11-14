import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.render("lobby", { message: "Welcome to the Lobby!" });
});

export default router;
