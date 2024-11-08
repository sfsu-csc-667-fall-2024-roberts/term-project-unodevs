import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.render("signup", { message: "Create an account to get started!" });
});

export default router;
