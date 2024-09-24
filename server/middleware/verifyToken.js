import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // Recupero il token dal cookie
  const token = req.cookies.token;

  // Se non c'è il token, restituisco un errore
  if (!token) return res.status(401).send("Non sei autenticato!");

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    //jwt.verify gives us a decoded object. If it's undefined, it means the token is invalid
    if (!decoded) {
      return res.status(401).json({ errorMessage: "Invalid token" });
    }
    // If the token is valid, we extract the userId from the decoded object and attach it to the req object so we can use it in the next middleware
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.log("Error verifying token", error);
    return res.status(500).json({ errorMessage: "Server error" });
  }
};
