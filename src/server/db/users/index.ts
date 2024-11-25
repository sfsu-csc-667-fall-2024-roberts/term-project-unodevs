import bcrypt from "bcrypt";
import { createHash } from "crypto";
import db from "../connection";
import { REGISTER_SQL, FIND_BY_EMAIL_SQL } from "./sql";

// Define the User type
type User = {
  id: number;
  username: string;
  email: string;
  gravatar: string;
};

// Define UserWithPassword, extending User to include the password field for login
type UserWithPassword = User & {
  password: string;
};

// Register function: Hashes the password and inserts a new user
const signup = async (
  username: string,
  email: string,
  clearTextPassword: string
): Promise<User> => {
  const password = await bcrypt.hash(clearTextPassword, 10);
  const gravatar = createHash("sha256").update(email).digest("hex");

  // Insert new user and return the inserted user data
  return await db.one<User>(REGISTER_SQL, [username, email, password, gravatar]);
};

// Find user by email
const findByEmail = (email: string): Promise<UserWithPassword> => {
  return db.one<UserWithPassword>(FIND_BY_EMAIL_SQL, [email]);
};

// Login function: Compares the provided password with the stored hash
const signin = async (email: string, clearTextPassword: string): Promise<User> => {
  const user = await findByEmail(email);
  const isValid = await bcrypt.compare(clearTextPassword, user.password);
  if (isValid) {
    // Return the user without the password field
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } else {
    throw new Error("Invalid credentials provided");
  }
};

// Export functions
export default { signup, signin, findByEmail };
