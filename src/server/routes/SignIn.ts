import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.render("signin", { message: "Please sign in to continue." });
});

export default router;
