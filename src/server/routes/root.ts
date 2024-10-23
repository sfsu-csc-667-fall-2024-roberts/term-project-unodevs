import express from "express";

const router = express.Router();

router.get("/", (_request, response) => {
    console.log("Root accessed"); //debuggin
    response.render("root", { title: "UnoDevs site" });
    });

export default router;