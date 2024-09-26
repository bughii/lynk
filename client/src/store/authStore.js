import { create } from "zustand";
import axios from "axios";
import { ADD_CONTACT_ROUTES } from "@/utils/constants";

const API_URL = "http://localhost:9001/api/auth";
const CONTACTS_URL = "http://localhost:9001/api/contacts";
axios.defaults.withCredentials = true;

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,

  signup: async (email, password, userName) => {
    try {
      const response = await axios.post(`${API_URL}/signup`, {
        email,
        password,
        userName,
      });
      set({ user: response.data.user, isAuthenticated: true });
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  },
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });
      set({ user: response.data.user, isAuthenticated: true });
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  },

  verifyEmail: async (code) => {
    try {
      const response = await axios.post(`${API_URL}/verify-email`, {
        code,
      });
      set({ user: response.data.user, isAuthenticated: true });
      return response.data;
    } catch (error) {
      console.log("Errore durante la verifica: ", error.response.data.message);
      throw new Error(error.response.data.message);
    }
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const response = await axios.get(`${API_URL}/check-auth`);
      set({
        user: response.data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
      });
    } catch (error) {
      set({ user: null, isCheckingAuth: false, isAuthenticated: false });
    }
  },

  updateProfile: async (avatar) => {
    try {
      const response = await axios.post(`${API_URL}/update-profile`, {
        avatar,
      });
      console.log("Risposta dell'API: ", response.data);

      set({
        user: {
          ...get().user,
          avatar: response.data.avatar,
          ...response.data.user,
        },
      });
      return response;
    } catch (error) {
      throw new Error("Errore durante aggiornamento profilo");
    }
  },

  updateProfileImage: async (formData) => {
    try {
      const response = await axios.post(
        `${API_URL}/add-profile-image`,
        formData
      );
      set({ user: { ...get().user, image: response.data.image } });
      return response;
    } catch (error) {
      throw new Error("Errore durante aggiornamento immagine profilo");
    }
  },

  removeProfileImage: async () => {
    try {
      const response = await axios.delete(`${API_URL}/remove-profile-image`);
      set({ user: { ...get().user, image: null } });
      return response;
    } catch (error) {
      throw new Error("Errore durante rimozione immagine profilo");
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        email,
      });
      set({ message: response.data.message });
    } catch (error) {
      throw new Error("Errore durante il recupero della password");
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await axios.post(`${API_URL}/reset-password/${token}`, {
        password,
      });
      set({ message: response.data.message });
    } catch (error) {
      throw new Error("Errore durante il reset della password");
    }
  },

  logout: async () => {
    try {
      await axios.post(`${API_URL}/logout`);
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      throw new Error("Errore durante il logout");
    }
  },

  addContact: async (searchTerm) => {
    try {
      const response = await axios.post(`${CONTACTS_URL}/search`, {
        searchTerm,
      });
      return response;
    } catch (error) {
      console.log("Errore ricerca: ", error);
      throw new Error("Errore durante ricerca");
    }
  },
}));
