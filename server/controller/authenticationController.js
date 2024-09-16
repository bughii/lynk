import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { compare } from "bcrypt";

const maxAge = 3 * 24 * 60 * 60 * 1000;
const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_KEY, {
    expiresIn: maxAge,
  });
};

export const login = async (req, res, next) => {
  try {
    // Prendo email e password dal body della richiesta
    const { email, password } = req.body;
    if (!email || !password) {
      // Bad request
      return res.status(400).send("Email e password necessari");
    }

    // Cerco un utente nel db con l'email fornita
    const user = await User.findOne({ email });
    if (!user) {
      // Not found
      return res.status(404).send("Utente non trovato");
    }

    // Controllo se password ricevuta dal client è uguale a quella salvata nel database
    const auth = await compare(password, user.password);
    if (!auth) {
      // Bad request
      return res.status(400).send("Credenziali non valide");
    }

    // Se il login va a buon fine, creo un token JWT
    res.cookie("jwt", createToken(email, user.id), {
      maxAge,
      secure: true,
      sameSite: "None",
    });

    // La res sarà un json con i dati dell'utente
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
        userName: user.userName,
        image: user.image,
      },
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal server error");
  }
};

export const signup = async (req, res, next) => {
  try {
    // Prendo email e password dal body della richiesta
    const { email, password } = req.body;
    if (!email || !password) {
      // Bad request
      return res.status(400).send("Email e password sono necessari");
    }

    // Se ricevo email e password, creo un nuovo utente
    const user = await User.create({ email, password });

    // Creo un token JWT e lo imposto come cookie
    res.cookie("jwt", createToken(email, user.id), {
      maxAge,
      secure: true,
      sameSite: "None",
    });

    // Risposta con stato 201 CREATED e un oggetto json con i dati dell'utente
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
      },
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal server error");
  }
};
