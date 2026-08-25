export function notFoundHandler(req, res) {
  res.status(404).json({ message: "Route not found." });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  res.status(500).json({ message: "An unexpected server error occurred." });
}
