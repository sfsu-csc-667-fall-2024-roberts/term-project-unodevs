import pgp from "pg-promise";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const pgpInstance = pgp();
const connection = pgpInstance(process.env.DATABASE_URL as string);

connection.connect()
    .then(() => console.log("Connected to PostgreSQL database"))
    .catch((error) => console.error("Database connection error:", error));

export { pgpInstance as pgp };
export default connection;
