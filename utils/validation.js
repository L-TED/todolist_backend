/**
 * Validation utilities for API requests
 */

const DESCRIPTION_MIN_LENGTH = 1;
const DESCRIPTION_MAX_LENGTH = 500;

export class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
    this.name = "ValidationError";
  }
}

/**
 * Validate description field
 */
export const validateDescription = (description) => {
  if (!description || typeof description !== "string") {
    throw new ValidationError("Description is required and must be a string");
  }

  const trimmed = description.trim();

  if (trimmed.length < DESCRIPTION_MIN_LENGTH) {
    throw new ValidationError("Description cannot be empty");
  }

  if (trimmed.length > DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(`Description must not exceed ${DESCRIPTION_MAX_LENGTH} characters`);
  }

  return trimmed;
};

/**
 * Validate ID parameter
 */
export const validateId = (id) => {
  const parsed = parseInt(id, 10);

  if (isNaN(parsed) || parsed <= 0) {
    throw new ValidationError("Invalid ID format");
  }

  return parsed;
};

/**
 * Validate boolean field
 */
export const validateBoolean = (value) => {
  if (typeof value !== "boolean") {
    throw new ValidationError("Value must be a boolean");
  }

  return value;
};
