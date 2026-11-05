const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

export const validateCourse = (data, { partial = false } = {}) => {
  const errors = {};

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      body: "Please provide valid course information.",
    };
  }

  const requiredFields = [
    "title",
    "code",
    "introduction",
    "description",
  ];

  for (const field of requiredFields) {
    if (!partial || data[field] !== undefined) {
      if (!isNonEmptyString(data[field])) {
        errors[field] = `${field} is required and must be valid text.`;
      }
    }
  }

  if (data.code !== undefined && isNonEmptyString(data.code)) {
    if (!/^[A-Za-z0-9_-]+$/.test(data.code.trim())) {
      errors.code = "Course code can only contain letters, numbers, hyphens and underscores.";
    }
  }

  if (data.capacity !== undefined) {
    const capacity = Number(data.capacity);

    if (!Number.isInteger(capacity) || capacity < 1) {
      errors.capacity = "Capacity must be a positive whole number.";
    }
  }

  if (data.concepts !== undefined) {
    if (
      !Array.isArray(data.concepts) ||
      data.concepts.some(
        (concept) => !isNonEmptyString(concept)
      )
    ) {
      errors.concepts = "Concepts must be a list of non-empty text values.";
    }
  }

  if (
    data.instructor !== undefined &&
    typeof data.instructor !== "string"
  ) {
    errors.instructor = "Instructor must be text.";
  }

  const allowedStatuses = ["draft", "published", "archived"];

  if (
    data.status !== undefined &&
    !allowedStatuses.includes(data.status)
  ) {
    errors.status = "Status must be draft, published or archived.";
  }

  if (partial) {
    const allowedFields = [
      "title",
      "code",
      "introduction",
      "description",
      "concepts",
      "instructor",
      "capacity",
      "status",
    ];

    const hasUpdateField = allowedFields.some(
      (field) => data[field] !== undefined
    );

    if (!hasUpdateField) {
      errors.body = "Provide at least one valid course field to update.";
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
};