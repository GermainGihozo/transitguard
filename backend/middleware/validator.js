// Input validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters
  return password && password.length >= 8;
};

const validateRole = (role) => {
  const validRoles = ["super_admin", "company_admin", "station_officer", "authority", "conductor"];
  return validRoles.includes(role);
};

const validateNationalId = (id) => {
  return id && id.length >= 5 && id.length <= 50;
};

const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

// Convert field names to readable format
const formatFieldName = (field) => {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

// Middleware factory for request validation
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    Object.keys(schema).forEach((field) => {
      const rules = schema[field];
      const value = req.body[field];
      const fieldName = formatFieldName(field);

      // Required field validation
      if (rules.required && !value) {
        errors.push(`${fieldName} is required`);
        return;
      }

      // Skip other validations if field is empty and not required
      if (!value) return;

      // Email validation
      if (rules.type === "email" && !validateEmail(value)) {
        errors.push(`Please enter a valid email address (e.g., user@example.com)`);
      }

      // Password validation
      if (rules.type === "password" && !validatePassword(value)) {
        errors.push(`Password must be at least 8 characters long`);
      }

      // Role validation
      if (rules.type === "role" && !validateRole(value)) {
        errors.push(`Invalid role. Must be one of: super_admin, company_admin, station_officer, authority, conductor`);
      }

      // Phone validation
      if (rules.type === "phone" && !validatePhone(value)) {
        errors.push(`Please enter a valid phone number (e.g., +250788123456)`);
      }

      // National ID validation
      if (rules.type === "nationalId" && !validateNationalId(value)) {
        errors.push(`National ID must be between 5 and 50 characters`);
      }

      // Min length validation
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
      }

      // Max length validation
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${fieldName} must not exceed ${rules.maxLength} characters`);
      }

      // Custom pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(rules.patternMessage || `${fieldName} format is invalid`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.length === 1 ? errors[0] : "Please fix the following errors:",
        errors: errors.length > 1 ? errors : undefined
      });
    }

    next();
  };
};

module.exports = {
  validate,
  validateEmail,
  validatePassword,
  validateRole,
  validateNationalId,
  validatePhone
};
