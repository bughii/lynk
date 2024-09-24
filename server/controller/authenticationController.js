import { User } from "../models/UserModel.js";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { renameSync, unlinkSync } from "fs";
import bcryptjs from "bcryptjs";
import { generateVerificationToken } from "../utils/generateVerificationToken.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail } from "../emails/emails.js";
import { sendWelcomeEmail } from "../emails/emails.js";
import { sendPasswordResetEmail } from "../emails/emails.js";
import { sendResetSuccessEmail } from "../emails/emails.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Credenziali non valide" });
    }

    // Compare provided password with hashed password in the database
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Credenziali non valide" });
    }

    // Generate a token and set it as a cookie
    generateTokenAndSetCookie(res, user._id);
    user.lastLogin = new Date();
    await user.save();

    // Send a response with the user data. The password is set to undefined so it's not sent to the client
    res.status(200).json({
      success: true,
      message: "Login effettuato con successo",
      user: { ...user._doc, password: undefined },
    });
  } catch (error) {
    console.log("Errore nel login: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Errore interno del server" });
  }
};

export const signup = async (req, res) => {
  const { email, password, userName } = req.body;

  try {
    // Check if email, password and userName are provided
    if (!email || !password || !userName) {
      // Bad request
      return res.status(400).send("Email, password e username sono necessari");
    }
    // Check if a user with the same email or userName already exists
    const userAlreadyExists = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (userAlreadyExists) {
      if (userAlreadyExists.email === email) {
        return res.status(400).json({
          errorType: "email_in_use",
          message: "Email già in uso",
        });
      }

      if (userAlreadyExists.userName === userName) {
        return res.status(400).json({
          errorType: "username_in_use",
          message: "Username già in uso",
        });
      }
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Generate a verification token which will be used to verify the user's email
    const verificationToken = generateVerificationToken();

    // Create a new user object
    const user = new User({
      email,
      password: hashedPassword,
      userName,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
    await user.save();

    // Generate a token and set it as a cookie
    generateTokenAndSetCookie(res, user._id);

    // Send a verification email to the user
    await sendVerificationEmail(user.email, verificationToken);

    // Respond with a success message and the user data. The password is set to undefined so it's not sent to the client
    return res.status(201).json({
      success: true,
      message: "Utente registrato con successo",
      ...user._doc,
      password: undefined,
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal server error");
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { userId } = req;
    const { avatar } = req.body;

    // Update user profile with the new
    const userData = await User.findByIdAndUpdate(
      userId,
      {
        avatar,
        profileSetup: true,
      },
      { new: true, runValidators: true }
    );

    // Respond with the updated user data
    return res.status(200).json({
      id: userData.id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      userName: userData.userName,
      isVerified: userData.isVerified,
      image: userData.image,
      avatar: userData.avatar,
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal server error");
  }
};

export const addProfileImage = async (req, res, next) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Nessun file caricato. Devi caricarne uno." });
    }

    // Generate a unique file name using uuid
    const fileName = "uploads/profiles/" + uuidv4() + req.file.originalname;
    renameSync(req.file.path, fileName);

    // Update the user's image field
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { image: fileName },
      { new: true, runValidators: true }
    );

    // Respond with updated image data
    return res.status(200).json({
      image: updatedUser.image,
      message: "Immagine profilo aggiornata con successo",
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error ADD IMG" });
  }
};

export const removeProfileImage = async (req, res, next) => {
  try {
    // Get the userId from the request
    const { userId } = req;
    // Find user by id
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("Utente non trovato");
    }

    // If the user has an image, remove it from the filesystem
    if (user.image) {
      console.log("Removing image: ", user.image);
      unlinkSync(user.image);
    }

    // Update the user's image field to null
    user.image = null;
    await user.save();

    return res.status(200).json({ message: "Immagine rimossa con successo" });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal server error");
  }
};

export const verifyEmail = async (req, res) => {
  // Get the verification code from the request body
  const { code } = req.body;
  try {
    // Find a user with the verification code and a valid expiration date
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Mark the user as verified and clear the verification token and expiration date
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    // Send a welcome email to the user
    await sendWelcomeEmail(user.email, user.userName);

    res.status(200).json({
      success: true,
      message: "Email verified",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("Error verifying email", error);
    res.status(400).json({ success: false, message: "Server error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(400).json({ errorMessage: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("Error checking auth", error);
    res.status(500).json({ errorMessage: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate a password reset token and set an expiration time
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 ora

    // Update the user's reset password token and expiration date
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();

    // Send a password reset email to the user
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );

    res
      .status(200)
      .json({ success: true, message: "Password reset email sent" });
  } catch (error) {
    console.log("Error sending password reset email", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user with matching reset token and a valid expiration date
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    // Hash the new password and update the user's password field
    const hashedPassword = await bcryptjs.hash(password, 12);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    // Send a password reset success email to the user
    await sendResetSuccessEmail(user.email);

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.log("Error resetting password", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
