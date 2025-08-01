import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export function authenticateJWT(req, res, next) {
  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.BYPASS_AUTH === 'true'
  ) {
    req.user = { id: 'dev-user' };
    return next();
  }
  const authHeader = req.headers['authorization'] || req.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
} 