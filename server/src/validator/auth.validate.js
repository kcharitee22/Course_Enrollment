
export const validateRegistration = ({ name, email, password }) => {
  const errors = {};

  // 1. Validate name
  if (!name || !name.trim()) {
    errors.name = "Name is required.";
  } else if (name.trim().length < 2) {
    errors.name = "Name must contain at least 2 characters.";
  }

  // 2. Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailRegex.test(email.trim())) {
    errors.email = "Please provide a valid email address.";
  }

  // 3. Validate password
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must contain at least 8 characters.";
  }

  // Return all errors, or null if validation succeeds
  return Object.keys(errors).length > 0 ? errors : null;
};



export const validateLogin = ({ email, password }) => {
  const errors = {};

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailRegex.test(email.trim())) {
    errors.email = "Please provide a valid email address.";
  }

  // Validate password
  if (!password) {
    errors.password = "Password is required.";
  }

  return Object.keys(errors).length > 0 ? errors : null;
};
