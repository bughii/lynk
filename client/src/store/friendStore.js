import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:9001/api/friendship";
axios.defaults.withCredentials = true;

export const useFriendStore = create((set) => ({
  friends: [], // List of friends
  pendingRequests: [], // List of pending requests
  sentRequests: [], // List of sent requests
  receivedRequests: [], // List of received requests
  searchedFriendsList: [], // List of searched friends
  error: null,

  // Function to send a friend request
  sendRequest: async (recipientId) => {
    try {
      const response = await axios.post(`${API_URL}/send-request`, {
        recipientId,
      });
      return response;
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.message
        : "Errore sconosciuto.";
      set({ error: errorMessage });
      throw error;
    }
  },

  // Function to accept a friend request
  acceptRequest: async (requestId) => {
    try {
      const response = await axios.post(`${API_URL}/accept-request`, {
        requestId,
      });
      if (response.status === 200) {
        set((state) => ({
          friends: [...state.friends, response.data.friendship], // Add the new friend to the list
          receivedRequests: state.receivedRequests.filter(
            (request) => request._id !== requestId // Remove the accepted request from received requests
          ),
        }));
        return response.data;
      }
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.message
        : "Errore sconosciuto.";
      set({ error: errorMessage });
      throw error;
    }
  },

  // Function to reject a friend request
  rejectRequest: async (requestId) => {
    try {
      const response = await axios.post(`${API_URL}/reject-request`, {
        requestId,
      });
      if (response.status === 200) {
        set((state) => ({
          receivedRequests: state.receivedRequests.filter(
            (request) => request._id !== requestId
          ), // Remove the rejected request from received requests
        }));
        return response;
      }
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.message
        : "Errore sconosciuto.";
      set({ error: errorMessage });
      throw error;
    }
  },

  // Function to cancel a friend request
  cancelRequest: async (requestId) => {
    try {
      const response = await axios.post(`${API_URL}/cancel-request`, {
        requestId,
      });
      if (response.status === 200) {
        set((state) => ({
          pendingRequests: state.pendingRequests.filter(
            (req) => req.id !== requestId // Remove the cancelled request from pending requests
          ),
          error: null,
        }));
      }
      return response;
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.message
        : "Errore sconosciuto.";
      set({ error: errorMessage });
    }
  },

  // Function to fetch received requests
  fetchReceivedRequests: async () => {
    try {
      const response = await axios.get(`${API_URL}/received-requests`);
      set({ receivedRequests: response.data.receivedRequests, error: null }); // Update the state with the received requests
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.message
        : "Errore sconosciuto.";
      set({ error: errorMessage });
    }
  },

  // Function to fetch sent requests
  fetchSentRequests: async () => {
    try {
      const response = await axios.get(`${API_URL}/sent-requests`);

      set({
        sentRequests: response.data.sentRequests, // Update the state with the sent requests
        error: null,
      });
    } catch (error) {
      console.error("Errore nel caricamento delle richieste inviate", error);
      set({ error: "Impossibile caricare le richieste inviate." });
    }
  },

  // Function to fetch user's friends
  fetchFriends: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/get-friends`);
      if (response.status === 200) {
        set({ friends: response.data.friends }); // Update the state with the friends
      }
    } catch (error) {
      console.error("Errore nel recuperare gli amici:", error);
      set({ error: error.response?.data.message || "Errore nel server." });
    }
  },

  // Function to remove a friend
  removeFriend: async (friendId) => {
    try {
      const response = await axios.post(`${API_URL}/remove-friend`, {
        friendId,
      });

      if (response.status === 200) {
        set((state) => ({
          friends: state.friends.filter((friend) => friend._id !== friendId), // Remove the friend from the list
        }));
        return response;
      }
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.message
        : "Errore sconosciuto.";
      set({ error: errorMessage });
      throw error;
    }
  },

  searchFriends: async (searchTerm) => {
    console.log("search Term", searchTerm);
    try {
      const response = await axios.post(`${API_URL}/search-friends`, {
        searchTerm,
      });
      set({ searchedFriendsList: response.data.friends });
      return response;
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.message
        : "Errore durante la ricerca degli amici.";
      set({ error: errorMessage });
    }
  },

  resetSearchedFriends: () => set({ searchedFriendsList: [] }),
}));
