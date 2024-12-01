import { Request, Response } from "express";
import db from "../db/connection";
import bcrypt from "bcrypt";

const register = async (req: Request, res: Response): Promise<void> => {
  const { username, password, email } = req.body;
  if (username && password && email) {
    const salt = "batteryAnt"; // TODO: Find out what this is for...
    const selectUserQuery =
      "SELECT * FROM users WHERE username = $1 or email = $2";
    try {
      const result = await db.query(selectUserQuery, [username, email]);
      const errors: string[] = [];
      if (result.length > 0) {
        result.forEach((user: any) => {
          if (user.username === username) {
            errors.push("username is taken");
          }

          if (user.email === email) {
            errors.push("email is taken");
          }
        });

        req.session.errors = errors.join("\n");
        return res.redirect("/signup");
      }
    } catch (error) {
      console.error(error);

      req.session.errors = "Internal Server Errors";
      return res.redirect("/signup");
    }

    bcrypt.hash(password, 10, async (err, hash) => {
      if (err) {
        console.error("error hashing password: " + err);

        req.session.errors = "Internal Server Errors";
        return res.redirect("/signup");
      }

      const insertNewUserQuery =
        "INSERT INTO users (username, password, email, salt, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)";
      try {
        await db.query(insertNewUserQuery, [username, hash, email, salt]);

        res.redirect("/signin");
      } catch (err) {
        console.error("error inserting into db: " + err);

        req.session.errors = "Internal Server Error";
        return res.redirect("/signup");
      }
    });
  } else {
    req.session.errors = undefined;
    return res.redirect("/signup");
  }
};

const login = async (req: Request, res: Response): Promise<void> => {
  const { usernameOrEmail, password } = req.body;

  if (usernameOrEmail && password) {
    const querySelectUser =
      "SELECT * FROM users WHERE (username = $1 OR email = $1)";

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
    } catch (err) {
      console.error(err);
      return res.redirect("/signin");
    }
  } else {
    req.session.errors = "Must provide both username/email and password";
    return res.redirect("/signin");
  }
};

const logout = (req: Request, res: Response): void => {
    req.session.destroy((err: Error | null) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error occurred during logout");
      } else {
        res.redirect("/signin");
      }
    });
  };
  

export { register, login, logout };
