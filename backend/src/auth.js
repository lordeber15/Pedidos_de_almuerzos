import jwt from 'jsonwebtoken';

const SECRET = () => process.env.JWT_SECRET || 'dev-secret';

export function firmarToken(payload) {
  return jwt.sign(payload, SECRET(), { expiresIn: '12h' });
}

// Protege las rutas de administracion: exige un JWT valido.
export function requiereAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Se requiere autenticacion de administrador.' });
  }
  try {
    const datos = jwt.verify(token, SECRET());
    req.admin = datos;
    return next();
  } catch {
    return res.status(401).json({ error: 'Sesion invalida o expirada.' });
  }
}
