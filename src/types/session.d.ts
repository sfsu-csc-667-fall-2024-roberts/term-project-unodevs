import { User } from "../../server/db/users"; // Adjust path if necessary

declare module "express-session" {
    interface Session {
        user?: User;
    }
}
