import express from "express";
import { Users } from "../db"; // Adjust the import path as necessary

const router = express.Router();

// GET route to render the sign-in page
router.get("/signin", (req, res) => {
    res.render("signin", { message: "Please sign in to continue.", errors: null });
});

// GET route to render the sign-up page
router.get("/signup", (req, res) => {
    res.render("signup", { message: "Create an account to get started!", errors: null });
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
        res.render("signup", {
            message: "Create an account to get started!",
            errors: "Failed to register user. Please try again.",
        });
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
        res.render("signin", {
            message: "Please sign in to continue.",
            errors: "Invalid email or password. Please try again.", // Custom error message for login failure
        });
    }
});

// GET route for user logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/"); // Redirect to home page after logout
    });
});

export default router;
