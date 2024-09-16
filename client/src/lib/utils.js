import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import man1 from "../assets/man1.png";
import man from "../assets/man.png";
import girl1 from "../assets/girl1.png";
import girl from "../assets/girl.png";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Array di URL degli avatar
export const avatars = [man1, man, girl1, girl];

// Accetta un indice avatar
// Se è valido (0-3) restituisce l'avatar corrispondente da avatars
export const getAvatar = (avatarIndex) => {
  if (avatarIndex >= 0 && avatarIndex < avatars.length) {
    return avatars[avatarIndex];
  }
  return avatars[0]; // Default in caso di errore
};
