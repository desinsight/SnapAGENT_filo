export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd
    ? '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    : err.message;
  res.status(status).json({
    success: false,
    error: message,
    code: err.code || undefined
  });
}

export function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
} 