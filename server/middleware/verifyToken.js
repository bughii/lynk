import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // Retrieve the token from the cookies
  const token = req.cookies.token;

  // If there's no token, we return a 401 Unauthorized response
  if (!token) return res.status(401).send("Non sei autenticato!");

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    //jwt.verify gives us a decoded object. If it's undefined, it means the token is invalid
    if (!decoded) {
      return res.status(401).json({ errorMessage: "Invalid token" });
    }
    // If the token is valid, we extract the userId from the decoded object and attach it to the req object so we can use it in the next middleware
    req.userId = decoded.userId;
    console.log("User ID:", req.userId);
    next();
  } catch (error) {
    console.log("Error verifying token", error);
    return res.status(500).json({ errorMessage: "Server error" });
  }
};
