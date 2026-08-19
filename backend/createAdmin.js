require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function createAdmin() {
    try {
        const username = "admin";
        const password = "admin123";

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            "INSERT INTO admins (username, password) VALUES (?, ?)",
            [username, hashedPassword]
        );

        console.log("Admin created successfully!");

        process.exit();
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
}

createAdmin();