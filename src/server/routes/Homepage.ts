import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.render("homepage", { message: "Welcome to the Homepage!" });
});

export default router;
