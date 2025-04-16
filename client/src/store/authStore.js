import { create } from "zustand";
import axios from "axios";
import { apiClient } from "@/lib/api-client";

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
      return response.data;
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
      return response.data;
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

  updateProfile: async (profileData) => {
    // Accepts an object, e.g., { avatar: number } or { userName: string }
    try {
      // *** CHANGE THIS LINE BACK TO axios.post ***
      const response = await axios.post(
        `${API_URL}/update-profile`,
        profileData
      );

      console.log("AuthStore updateProfile API Response: ", response.data);

      if (response.status === 200) {
        set((state) => {
          // Start with current user state
          const currentUser = state.user || {};
          // Update with the data returned from the API response
          // Adjust based on your actual API response structure (e.g., response.data or response.data.user)
          const updatedUserData = {
            ...currentUser,
            ...(response.data.user || response.data),
          };

          // *** CRITICAL: If avatar is being set, clear the image field ***
          if (profileData.avatar !== undefined && profileData.avatar !== null) {
            updatedUserData.image = null; // Clear custom image path
            updatedUserData.avatar = profileData.avatar; // Ensure the avatar index is explicitly set
            console.log("AuthStore: Avatar set, clearing image path.");
          } else if (profileData.userName !== undefined) {
            // Example: If updating userName, ensure it's reflected
            updatedUserData.userName = profileData.userName;
          }
          // Add similar checks if updating other profile fields via this function

          return { user: updatedUserData };
        });
        return response; // Return the full response object
      } else {
        // Handle non-200 success responses if necessary
        console.error(
          "AuthStore updateProfile: API returned status",
          response.status
        );
        throw new Error(response.data?.message || "Failed to update profile");
      }
    } catch (error) {
      console.error(
        "AuthStore updateProfile Error:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || "Error updating profile"
      );
    }
  },

  updateProfileImage: async (formData) => {
    try {
      const response = await axios.post(
        `${API_URL}/add-profile-image`, // Ensure this route is correct on your backend
        formData,
        { headers: { "Content-Type": "multipart/form-data" } } // Correct header for file uploads
      );

      const imagePathFromApi = response.data?.image; // Image path

      // Check for success and valid image path
      if (response.status === 200 && imagePathFromApi) {
        // Update the Zustand store state using the 'set' function
        set((state) => {
          const updatedUser = {
            ...state.user, // Copy existing user properties
            image: imagePathFromApi, // Set the new image path from API response
            avatar: undefined, // Clear the avatar index, as custom image takes precedence
          };

          return { user: updatedUser };
        });

        return response;
      } else {
        // API call succeeded (status 200) but response lacked the image path,
        // or the status code was not 200.
        console.error(
          "AuthStore updateProfileImage: API check failed or image path missing in response.",
          response
        );
        // Throw an error to be caught by the calling component
        throw new Error(
          response.data?.message || // Use server message if available
            "Invalid response from server when updating image"
        );
      }
    } catch (error) {
      // Handle errors from the axios call itself (network errors, 4xx/5xx status codes)
      console.error(
        "AuthStore updateProfileImage Axios Error:",
        // Log specific details if available (e.g., error.response.data for server errors)
        error.response?.data || error.message
      );
      // Rethrow the error, potentially extracting a user-friendly message
      throw new Error(
        error.response?.data?.message || // Use server message if available
          "Error updating profile image" // Generic fallback message
      );
    }
  },

  removeProfileImage: async () => {
    try {
      const response = await axios.delete(`${API_URL}/remove-profile-image`);
      console.log(
        "AuthStore removeProfileImage API Response status:",
        response.status
      );
      // Check for success
      if (response.status === 200) {
        set((state) => ({
          user: {
            ...state.user,
            image: null, // Set image path to null
            avatar: 0,
          },
        }));

        return response; // Return the full response object
      } else {
        console.error(
          "AuthStore removeProfileImage: API returned status",
          response.status
        );
        throw new Error(
          response.data?.message || "Failed to remove profile image"
        );
      }
    } catch (error) {
      console.error(
        "AuthStore removeProfileImage Error:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || "Error removing profile image"
      );
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
