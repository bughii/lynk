import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // Recupero il token dal cookie
  const token = req.cookies.jwt;

  // Se non c'è il token, restituisco un errore
  if (!token) return res.status(401).send("Non sei autenticato!");

  // Verifico il token
  jwt.verify(token, process.env.JWT_KEY, async (err, payload) => {
    // Se il token non è valido, restituisco un errore
    if (err) return res.status(403).send("Token non valido");
    // Se il token è valido, salvo l'id dell'utente nella req
    req.userId = payload.userId;
    next();
  });
};
