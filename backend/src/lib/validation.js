export class ValidationError extends Error {
  constructor(field, message, code = "VALIDATION_ERROR") {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.code = code;
    this.statusCode = 400;
  }
}

export function validateMultilingual(value, fieldName, options = {}) {
  if (!value || typeof value !== "object") {
    throw new ValidationError(fieldName, `${fieldName} doit être un objet`);
  }
  const requiredLangs = ["fr", "en", "ar"];
  if (options.required) {
    for (const lang of requiredLangs) {
      if (!value[lang] || !value[lang].trim()) {
        throw new ValidationError(fieldName, `${fieldName}.${lang} est requis`);
      }
    }
  }
  for (const lang of requiredLangs) {
    if (value[lang]) {
      if (typeof value[lang] !== "string") {
        throw new ValidationError(
          fieldName,
          `${fieldName}.${lang} doit être une chaîne`,
        );
      }
      const maxLen = options.maxLength || 2000;
      if (value[lang].length > maxLen) {
        throw new ValidationError(
          fieldName,
          `${fieldName}.${lang} ne doit pas dépasser ${maxLen} caractères`,
        );
      }
    }
  }
  return value;
}

export function validateIntegerId(value, fieldName) {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new ValidationError(
      fieldName,
      `${fieldName} doit être un entier positif`,
    );
  }
  return num;
}

export function validateEntityExists(entity, fieldName, entityType) {
  if (!entity) {
    throw new ValidationError(fieldName, `${entityType} non trouvé(e)`);
  }
  return entity;
}

export async function handleValidationError(error, reply, logger) {
  if (error instanceof ValidationError) {
    logger.warn(
      { field: error.field, code: error.code, message: error.message },
      "Validation error",
    );
    return reply
      .status(400)
      .send({ error: error.code, message: error.message, field: error.field });
  }
  if (error.code === "P2002") {
    const field = error.meta?.target?.[0] || "field";
    logger.warn({ field, code: "P2002" }, "Unique constraint violation");
    return reply.status(409).send({
      error: "DUPLICATE_ERROR",
      message: `Un enregistrement avec ce ${field} existe déjà`,
      field,
    });
  }
  if (error.code === "P2025") {
    return reply
      .status(404)
      .send({ error: "NOT_FOUND_ERROR", message: "Enregistrement non trouvé" });
  }
  if (error.code === "P2003") {
    return reply.status(400).send({
      error: "FOREIGN_KEY_ERROR",
      message: "Une référence requise n'existe pas",
    });
  }
  logger.error(error, "Unhandled error");
  return reply.status(500).send({
    error: "INTERNAL_ERROR",
    message: "Une erreur inattendue s'est produite",
  });
}
