import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useSocket } from "@/context/SocketContext";

export const useBlockStatus = (userId) => {
  const [loading, setLoading] = useState(true);
  const [userHasBlocked, setUserHasBlocked] = useState(false);
  const [userIsBlocked, setUserIsBlocked] = useState(false);
  const { t } = useTranslation();
  const socket = useSocket();

  // Check the block status
  const checkBlockStatus = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await apiClient.get(`/api/block/status/${userId}`);

      setUserHasBlocked(response.data.userHasBlocked);
      setUserIsBlocked(response.data.userIsBlocked);
    } catch (error) {
      console.error("Error checking block status:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Block a user
  const blockUser = async () => {
    try {
      const response = await apiClient.post("/api/block/block", {
        blockedUserId: userId,
      });

      if (response.status === 201) {
        setUserHasBlocked(true);
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

  // Unblock a user
  const unblockUser = async () => {
    try {
      const response = await apiClient.post("/api/block/unblock", {
        blockedUserId: userId,
      });

      if (response.status === 200) {
        setUserHasBlocked(false);
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

  // Listen to real-time block events
  useEffect(() => {
    if (!socket || !userId) return;

    // When this user gets blocked
    const handleBlockedByUser = (data) => {
      if (data.blockerId === userId) {
        setUserIsBlocked(true);
      }
    };

    // When this user gets unblocked
    const handleUnblockedByUser = (data) => {
      if (data.unblockerId === userId) {
        setUserIsBlocked(false);
      }
    };

    socket.on("blockedByUser", handleBlockedByUser);
    socket.on("unblockedByUser", handleUnblockedByUser);

    return () => {
      socket.off("blockedByUser", handleBlockedByUser);
      socket.off("unblockedByUser", handleUnblockedByUser);
    };
  }, [socket, userId]);

  // Initial check
  useEffect(() => {
    if (userId) {
      checkBlockStatus();
    }
  }, [userId, checkBlockStatus]);

  return {
    loading,
    userHasBlocked,
    userIsBlocked,
    blockUser,
    unblockUser,
    refreshStatus: checkBlockStatus,
  };
};
