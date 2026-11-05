import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    // Check whether the session contains a user ID
    if (!req.session.userId) {
      return res.status(401).json({
        message: "You are not authenticated. Please log in.",
      });
    }

    // Find the user in MongoDB
    const user = await User.findById(req.session.userId)
      .select("-password");

    // Check whether the account still exists
    if (!user) {
      return res.status(401).json({
        message: "User account not found. Please log in again.",
      });
    }

    // Make the user available to the next middleware or controller
    req.user = user;

    // Continue to the next step
    next();

  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      message: "Authentication failed due to a server error.",
    });
  }
};



export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    message: "Access denied. Administrators only.",
  });
};


export const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === "student") {
    return next();
  }

  return res.status(403).json({
    message: "Access denied. Students only.",
  });
};