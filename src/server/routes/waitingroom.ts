import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.render("waitingroom", { message: "Welcome to the Waiting Room!" });
});

export default router;
