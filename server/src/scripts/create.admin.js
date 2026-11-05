
import "dotenv/config";

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import connectDB from "../config/db.js";
import User from "../models/User.js";

const createAdmin = async () => {
  try {
    // 1. Read admin details from environment variables
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    // 2. Check that all required details exist
    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Please provide ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in your .env file.");
    }

    if (ADMIN_PASSWORD.length < 8) {
      throw new Error("Admin password must contain at least 8 characters.");
    }

    // 3. Connect to MongoDB
    await connectDB();

    // 4. Normalize the email address
    const normalizedEmail = ADMIN_EMAIL.trim().toLowerCase();

    // 5. Check whether this account already exists
    const existingAdmin = await User.findOne({
      email: normalizedEmail,
    });

    if (existingAdmin) {
      throw new Error("An account with this email already exists. No new account was created.");
    }

    // 6. Hash the admin password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    // 7. Create the admin account
    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Administrator account created successfully!");
    console.log("Admin email:", admin.email);
    console.log("Admin role:", admin.role);

  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    // 8. Close the MongoDB connection
    await mongoose.disconnect();
  }
};

createAdmin();
