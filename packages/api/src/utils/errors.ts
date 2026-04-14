export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  notFound: (what: string) => new AppError(404, 'NOT_FOUND', `${what} not found`),
  unauthorized: (msg = 'Unauthorized') => new AppError(401, 'UNAUTHORIZED', msg),
  forbidden: (msg = 'Forbidden') => new AppError(403, 'FORBIDDEN', msg),
  conflict: (msg: string) => new AppError(409, 'CONFLICT', msg),
  validation: (msg: string) => new AppError(400, 'VALIDATION_ERROR', msg),
  handleTaken: () => new AppError(409, 'HANDLE_TAKEN', 'This handle is already taken'),
};
