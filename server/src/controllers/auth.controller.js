import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { validateRegistration , validateLogin} from "../validator/auth.validate.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate registration details
    const validationError = validateRegistration({
      name,
      email,
      password,
    });

    if (validationError) {
      return res.status(400).json({
        message: "Please correct the highlighted fields.",
        errors: validationError,
      });
    }

    // 2. Normalize user information
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    // 3. Check whether the email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // 4. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create the user
    const newUser = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    // 6. Return the successful response
    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      message: "Something went wrong while creating your account.",
    });
  }
};


// ================= LOGIN CONTROLLER ===========================

export const loginUser = async (req, res, next) => {
  try {
    // 1. Receive login details
    const { email, password } = req.body;

    // 2. Validate login details
    const validationError = validateLogin({
      email,
      password,
    });

    if (validationError) {
      return res.status(400).json({
        message: "Please correct the highlighted fields.",
        errors: validationError,
      });
    }

    // 3. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Find the user in MongoDB
    const user = await User.findOne({
      email: normalizedEmail,
    });

    // 5. Check whether the account exists
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // 6. Compare submitted password with stored password hash
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // 7. Create a new session
    req.session.regenerate((error) => {
      if (error) {
        return next(error);
      }

      req.session.userId = user._id.toString();
      req.session.role = user.role;

      // 8. Save the session before responding
      req.session.save((error) => {
        if (error) {
          return next(error);
        }

        return res.status(200).json({
          message: "Login successful.",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Something went wrong while logging in.",
    });
  }
};

// ==================== Logout ======================

export const logoutUser = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("classEnroll.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logout successful.",
    });
  });
};

// ============= current user point ==============

export const getCurrentUser = async (req, res) => {
  try {
    // 1. Check whether a user is logged in
    if (!req.session.userId) {
      return res.status(401).json({
        message: "You are not logged in.",
      });
    }

    // 2. Find the logged-in user
    const user = await User.findById(req.session.userId)
      .select("-password");

    // 3. Check whether the account still exists
    if (!user) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    // 4. Return the user information
    return res.status(200).json({
      message: "User authenticated successfully.",
      user,
    });
  } catch (error) {
    console.error("Current user error:", error);

    return res.status(500).json({
      message: "Unable to retrieve user information.",
    });
  }
};