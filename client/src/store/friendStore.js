import { create } from "zustand";
import { apiClient } from "@/lib/api-client";

export const useFriendStore = create((set) => ({
  friends: [], // List of friends
  pendingRequests: [], // List of pending requests
  sentRequests: [], // List of sent requests
  receivedRequests: [], // List of received requests
  searchedFriendsList: [], // List of searched friends
  friendsPreview: [],
  error: null,

  // Function to send a friend request
  sendRequest: async (recipientId) => {
    try {
      const response = await apiClient.post("/friendship/send-request", {
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
      const response = await apiClient.post("/friendship/accept-request", {
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
      const response = await apiClient.post("/friendship/reject-request", {
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
      const response = await apiClient.post("/friendship/cancel-request", {
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
      const response = await apiClient.get("/friendship/received-requests");
      set({
        receivedRequests: response.data.receivedRequests || [],
        error: null,
      });
    } catch (error) {
      console.error("Error fetching received requests:", error);
      if (error.response && error.response.status === 404) {
        set({ receivedRequests: [], error: null });
      } else {
        const errorMessage = error.response
          ? error.response.data.message
          : "Errore sconosciuto.";
        set({ error: errorMessage });
      }
    }
  },

  // Function to fetch sent requests
  fetchSentRequests: async () => {
    try {
      const response = await apiClient.get("/friendship/sent-requests");

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
      const response = await apiClient.get("/friendship/get-friends");
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
      const response = await apiClient.post("/friendship/remove-friend", {
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
    try {
      const response = await apiClient.post("/friendship/search-friends", {
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

  getChatPreview: async () => {
    try {
      const response = await apiClient.get("/friendship/get-friends-preview");
      set({ friendsPreview: response.data.friends });
      return response;
    } catch (error) {
      console.log("Errore nel recupero degli amici", error);
    }
  },

  updateFriendStatus: (userId, isOnline) =>
    set((state) => ({
      friends: state.friends.map((friend) =>
        friend._id === userId ? { ...friend, isOnline } : friend
      ),
      friendsPreview: state.friendsPreview.map((friend) =>
        friend._id === userId ? { ...friend, isOnline } : friend
      ),
    })),

  updateFriendProfileImage: (userId, imageUrl) => {
    if (!userId || !imageUrl) return;

    set((state) => {
      // Update friends list
      const updatedFriends = state.friends.map((friend) =>
        friend._id === userId ? { ...friend, image: imageUrl } : friend
      );

      // Update friends preview
      const updatedFriendsPreview = state.friendsPreview.map((friend) =>
        friend._id === userId ? { ...friend, image: imageUrl } : friend
      );

      // Update received requests (if user sent a request)
      const updatedReceivedRequests = state.receivedRequests.map((request) => {
        if (request.requester && request.requester._id === userId) {
          return {
            ...request,
            requester: {
              ...request.requester,
              image: imageUrl,
            },
          };
        }
        return request;
      });

      // Update sent requests (if user received a request)
      const updatedSentRequests = state.sentRequests.map((request) => {
        if (request.recipient && request.recipient._id === userId) {
          return {
            ...request,
            recipient: {
              ...request.recipient,
              image: imageUrl,
            },
          };
        }
        return request;
      });

      // Update searched friends list
      const updatedSearchedFriendsList = state.searchedFriendsList.map(
        (friend) =>
          friend._id === userId ? { ...friend, image: imageUrl } : friend
      );

      return {
        friends: updatedFriends,
        friendsPreview: updatedFriendsPreview,
        receivedRequests: updatedReceivedRequests,
        sentRequests: updatedSentRequests,
        searchedFriendsList: updatedSearchedFriendsList,
      };
    });
  },
}));
