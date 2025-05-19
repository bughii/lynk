import { Router } from "express";

const healthRoutes = Router();

healthRoutes.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default healthRoutes;