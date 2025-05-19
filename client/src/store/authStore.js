import { create } from "zustand";
import { apiClient } from "@/lib/api-client";

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,

  signup: async (email, password, userName) => {
    try {
      const response = await apiClient.post("/auth/signup", {
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
      const response = await apiClient.post("/auth/login", {
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
      const response = await apiClient.post("/auth/verify-email", {
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
      const response = await apiClient.get("/auth/check-auth");
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
      const response = await apiClient.post(
        "/auth/update-profile",
        profileData
      );

      console.log("AuthStore updateProfile API Response: ", response.data);

      if (response.status === 200) {
        set((state) => {
          // Start with current user state
          const currentUser = state.user || {};
          const updatedUserData = {
            ...currentUser,
            ...(response.data.user || response.data),
          };

          if (profileData.avatar !== undefined && profileData.avatar !== null) {
            updatedUserData.image = null; // Clear custom image path
            updatedUserData.avatar = profileData.avatar; // Ensure the avatar index is explicitly set
            console.log("AuthStore: Avatar set, clearing image path.");
          } else if (profileData.userName !== undefined) {
            updatedUserData.userName = profileData.userName;
          }

          return { user: updatedUserData };
        });
        return response;
      } else {
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
      const res = await apiClient.post("/auth/add-profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const s3Url = res.data?.image;

      if (res.status === 200 && s3Url) {
        set((state) => ({
          user: {
            ...state.user,
            image: s3Url,
            avatar: undefined,
          },
        }));
        return res;
      }

      throw new Error(res.data?.message || "Invalid response from server");
    } catch (err) {
      console.error(
        "AuthStore updateProfileImage Axios Error:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.message || "Error updating profile image"
      );
    }
  },

  removeProfileImage: async () => {
    try {
      const response = await apiClient.delete("/auth/remove-profile-image");
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
      const response = await apiClient.post("/auth/forgot-password", {
        email,
      });
      set({ message: response.data.message });
    } catch (error) {
      throw new Error("Errore durante il recupero della password");
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await apiClient.post("/auth/reset-password/${token}", {
        password,
      });
      set({ message: response.data.message });
    } catch (error) {
      throw new Error("Errore durante il reset della password");
    }
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      throw new Error("Errore durante il logout");
    }
  },

  addContact: async (searchTerm) => {
    try {
      const response = await apiClient.post("/contacts/search", {
        searchTerm,
      });
      return response;
    } catch (error) {
      console.log("Errore ricerca: ", error);
      throw new Error("Errore durante ricerca");
    }
  },
}));
