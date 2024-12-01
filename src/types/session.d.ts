import { User } from "../../server/db/users"; // Adjust path if necessary
import "express-session";

declare module "express-session" {
    interface Session {
        user?: User;
        errors?: string;
        messages?: string;
    }
}

declare module "http" {
    interface IncomingMessage {
        session?: Session & {
            user?: User;
        };
    }
}
