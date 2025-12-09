// 404 for unknown routes
function notFound(_req, res) {
  res.status(404).json({ ok: false, error: "Route not found" });
}

// centralized error handler
function errorHandler(err, _req, res, _next) {
  // Known Mongo errors
  if (err?.code === 11000) {
    return res.status(409).json({
      ok: false,
      error: "Duplicate key",
      details: err.keyValue || null
    });
  }

  // Invalid ObjectId cast
  if (err?.name === "CastError") {
    return res.status(400).json({ ok: false, error: "Invalid ID format" });
  }

  // JWT errors (if any)
  if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }

  const status = err.statusCode || 500;
  const body = { ok: false, error: err.message || "Server error" };
  if (err.details) body.details = err.details;

  // Optional: log in dev
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error("[ERROR]", err);
  }

  return res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
