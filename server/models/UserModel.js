import mongoose from "mongoose";
import { genSalt, hash } from "bcrypt";

const { Schema } = mongoose;

// Definisco lo schema dell'utente
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: false,
    unique: true,
  },
  image: {
    type: String,
    required: false,
  },
  profileSetup: {
    type: Boolean,
    default: false,
  },
});

// Prima di salvare nel database
userSchema.pre("save", async function (next) {
  // Genero un salt
  // Utile per evitare che password uguali abbiano hash uguali
  const salt = await genSalt();
  // Hashing della password con il salt generato
  this.password = await hash(this.password, salt);
  next();
});

const User = mongoose.model("Users", userSchema);

export default User;
