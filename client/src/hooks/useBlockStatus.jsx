import { useState, useEffect, useCallback } from "react";
import { useChatStore } from "@/store/chatStore";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

/**
 * Custom hook to manage and check user blocking status
 * @param {string} targetUserId - The ID of the user to check blocking status against
 * @returns {Object} Block status and management methods
 */
export const useBlockStatus = (targetUserId) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [userHasBlocked, setUserHasBlocked] = useState(false);
  const [userIsBlocked, setUserIsBlocked] = useState(false);

  // Get chat store methods for UI updates
  const addBlockedUser = useChatStore((state) => state.addBlockedUser);
  const removeBlockedUser = useChatStore((state) => state.removeBlockedUser);
  const refreshSelectedChat = useChatStore(
    (state) => state.refreshSelectedChat
  );

  /**
   * Fetch current block status from the server
   */

  const fetchBlockStatus = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get(`/api/block/status/${targetUserId}`);

      if (response.status === 200) {
        setUserHasBlocked(response.data.userHasBlocked);
        setUserIsBlocked(response.data.userIsBlocked);

        // Update the local block store states
        if (response.data.userHasBlocked) {
          addBlockedUser(targetUserId);
        }
      }
    } catch (error) {
      console.error("Error fetching block status:", error);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, addBlockedUser]);

  /**
   * Block the target user
   * @returns {boolean} Success status
   */

  const blockUser = async () => {
    if (!targetUserId) return false;

    try {
      const response = await apiClient.post("/api/block/block", {
        blockedUserId: targetUserId,
      });

      if (response.status === 201) {
        // Update local states
        setUserHasBlocked(true);
        addBlockedUser(targetUserId);
        toast.success(t("block.userBlocked"));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error(t("block.errorBlocking"));
      return false;
    }
  };

  /**
   * Unblock the target user
   * @returns {boolean} Success status
   */

  const unblockUser = async () => {
    if (!targetUserId) return false;

    try {
      const response = await apiClient.post("/api/block/unblock", {
        blockedUserId: targetUserId,
      });

      if (response.status === 200) {
        // Update local states
        setUserHasBlocked(false);
        removeBlockedUser(targetUserId);
        toast.success(t("block.userUnblocked"));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error(t("block.errorUnblocking"));
      return false;
    }
  };

  /**
   * Force refresh of block status
   */

  const refreshStatus = useCallback(() => {
    fetchBlockStatus();
    refreshSelectedChat();
  }, [fetchBlockStatus, refreshSelectedChat]);

  // Initial fetch when hook mounts or targetUserId changes
  useEffect(() => {
    fetchBlockStatus();
  }, [targetUserId, fetchBlockStatus]);

  return {
    loading,
    userHasBlocked,
    userIsBlocked,
    blockUser,
    unblockUser,
    refreshStatus,
  };
};
