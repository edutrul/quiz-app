export class ApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found', extra = {}) {
    super(404, 'not_found', message, extra);
  }
}

export class ConflictError extends ApiError {
  constructor(code, message, extra = {}) {
    super(409, code, message, extra);
  }
}

export class ValidationError extends ApiError {
  constructor(code, message, extra = {}) {
    super(400, code, message, extra);
  }
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.code, message: err.message, ...err.extra });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'internal_error', message: 'Something went wrong' });
}
