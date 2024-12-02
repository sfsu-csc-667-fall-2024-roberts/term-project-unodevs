import { Request, Response } from "express";
import db from "../db/connection";
import bcrypt from "bcrypt";

// `register` function: Handles user registration
const register = async (req: Request, res: Response): Promise<void> => {
  const { username, password, email } = req.body;

  if (username && password && email) {
    const salt = "batteryAnt"; // TODO: Replace with actual logic if needed
    const imageUrl = "/default-avatar.png"; // Default image URL (replace with actual path)
    const selectUserQuery =
      "SELECT * FROM users WHERE username = $1 or email = $2";

    try {
      const result = await db.query(selectUserQuery, [username, email]);
      const errors: string[] = [];

      if (result.length > 0) {
        result.forEach((user: any) => {
          if (user.username === username) errors.push("Username is taken");
          if (user.email === email) errors.push("Email is taken");
        });

        req.session.errors = errors.join("\n");
        return res.redirect("/signup");
      }
    } catch (error) {
      console.error("Error during user validation:", error);
      req.session.errors = "Internal Server Error";
      return res.redirect("/signup");
    }

    bcrypt.hash(password, 10, async (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
        req.session.errors = "Internal Server Error";
        return res.redirect("/signup");
      }

      const insertNewUserQuery = `
        INSERT INTO users (username, password, email, salt, image_url, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`;

      try {
        await db.query(insertNewUserQuery, [username, hash, email, salt, imageUrl]);
        res.redirect("/signin");
      } catch (insertError) {
        console.error("Error inserting user into database:", insertError);
        req.session.errors = "Internal Server Error";
        return res.redirect("/signup");
      }
    });
  } else {
    req.session.errors = "All fields are required";
    return res.redirect("/signup");
  }
};

// `login` function: Handles user login
const login = async (req: Request, res: Response): Promise<void> => {
  const { usernameOrEmail, password } = req.body;

  if (usernameOrEmail && password) {
    const querySelectUser =
      "SELECT id, username, email, password FROM users WHERE username = $1 OR email = $1";

    try {
      const user = await db.oneOrNone(querySelectUser, [usernameOrEmail]);

      if (user && (await bcrypt.compare(password, user.password))) {
        req.session.user = {
          id: user.id,
          username: user.username,
          email: user.email,
        };
        req.session.messages = undefined;
        return res.redirect("/");
      } else {
        req.session.errors = "Invalid username or password";
        return res.redirect("/signin");
      }
    } catch (error) {
      console.error("Error during login:", error);
      req.session.errors = "Internal Server Error";
      return res.redirect("/signin");
    }
  } else {
    req.session.errors = "Both username/email and password are required";
    return res.redirect("/signin");
  }
};

// `logout` function: Handles user logout
const logout = (req: Request, res: Response): void => {
  req.session.destroy((err: Error | null) => {
    if (err) {
      console.error("Error during logout:", err);
      res.status(500).send("Error occurred during logout");
    } else {
      res.redirect("/signin");
    }
  });
};

// Export the functions
export { register, login, logout };
