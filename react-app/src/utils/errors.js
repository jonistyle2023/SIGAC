// Backend validation errors (MethodArgumentNotValidException) come back as
// { message: "Los parámetros de entrada no son válidos", details: { campo: "motivo exacto" } }
// while custom BadRequestExceptions come back as { message: "motivo exacto" } with no details.
// These helpers make sure the specific per-field reason is always surfaced instead of the generic message.

export function getErrorDetails(err) {
  const details = err?.response?.data?.details;
  return details && Object.keys(details).length > 0 ? Object.values(details) : null;
}

export function getErrorMessage(err, fallback) {
  const details = getErrorDetails(err);
  if (details) return details.join(' ');
  return err?.response?.data?.message || fallback;
}
