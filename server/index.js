const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

dotenv.config();

const app = express();
const port = process.env.PORT || 5005;

app.use(express.json());

const server = app.listen(port, () => {
  console.log(`Server sta runnando sulla porta ${port}`);
});
