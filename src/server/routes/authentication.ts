import express from "express";
import { Users } from "../db"; // Adjust the import path as necessary

const router = express.Router();

// GET route to render the sign-in page
router.get("/signin", (req, res) => {
    res.render("signin", { message: "Please sign in to continue." });
});

// GET route to render the sign-up page
router.get("/signup", (req, res) => {
    res.render("signup", { message: "Create an account to get started!" });
});

// POST route for user registration
router.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const user = await Users.signup(username, email, password);
        
        // Store user in session, ignoring TypeScript error for undefined session type
       
        req.session.user = user;
        
        res.redirect("/lobby"); // Redirect to the lobby on successful registration
    } catch (error) {
        console.error(error);
        req.flash("error", "Failed to register user"); // Flash error message
        res.redirect("/signup"); // Redirect back to sign-up on error
    }
});

// POST route for user login
router.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await Users.signin(email, password);
        
        // Store user in session, ignoring TypeScript error for undefined session type
        req.session.user = user;
        
        res.redirect("/lobby"); // Redirect to the lobby on successful login
    } catch (error) {
        console.error(error);
        req.flash("error", error as string); // Flash error message
        res.redirect("/signin"); // Redirect back to sign-in on error
    }
});

// GET route for user logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/"); // Redirect to home page after logout
    });
});

export default router;
