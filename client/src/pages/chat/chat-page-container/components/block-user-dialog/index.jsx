import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useChatStore } from "@/store/chatStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FaBan, FaUserSlash, FaUnlock } from "react-icons/fa";

/**
 * Dialog component to manage blocking/unblocking a user with instant UI updates
 */
function BlockUserDialog({ open, onOpenChange, userId, userName }) {
  const { t } = useTranslation();
  const socket = useSocket();
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get chat store methods
  const {
    blockedUsers,
    blockedByUsers,
    addBlockedUser,
    removeBlockedUser,
    refreshSelectedChat,
    setSelectedChatData,
    selectedChatData,
  } = useChatStore();

  // Check current block status
  const userHasBlocked = blockedUsers.includes(userId);
  const userIsBlocked = blockedByUsers.includes(userId);

  // Listen for block action completion confirmations
  useEffect(() => {
    if (!socket) return;

    const handleBlockActionComplete = (data) => {
      if (data.targetUserId === userId) {
        // Force refresh the UI if it's the current chat
        if (selectedChatData && selectedChatData._id === userId) {
          // Force a complete redraw by updating the chat data
          setSelectedChatData({
            ...selectedChatData,
            _blockActionCompleted: Date.now(),
          });
        }
      }
    };

    socket.on("blockActionComplete", handleBlockActionComplete);
    return () => socket.off("blockActionComplete", handleBlockActionComplete);
  }, [socket, userId, selectedChatData, setSelectedChatData]);

  const handleBlock = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post("/api/block/block", {
        blockedUserId: userId,
      });

      if (response.status === 201) {
        // Update local store state
        addBlockedUser(userId);

        // Force UI refresh by updating the chat data with the new block status
        if (selectedChatData && selectedChatData._id === userId) {
          setSelectedChatData({
            ...selectedChatData,
            _isBlocked: true,
            _blockTimestamp: Date.now(),
          });
        }

        // Notify other user via socket
        if (socket) {
          socket.emit("userBlocked", { blockedUserId: userId });
        }

        toast.success(t("block.userBlocked"));

        // Close dialogs
        setIsConfirming(false);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error(t("block.errorBlocking"));
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post("/api/block/unblock", {
        blockedUserId: userId,
      });

      if (response.status === 200) {
        // Update local store state
        removeBlockedUser(userId);

        // Force UI refresh by updating the chat data with the new block status
        if (selectedChatData && selectedChatData._id === userId) {
          setSelectedChatData({
            ...selectedChatData,
            _isBlocked: false,
            _blockTimestamp: Date.now(),
          });
        }

        // Notify other user via socket
        if (socket) {
          socket.emit("userUnblocked", { blockedUserId: userId });
        }

        toast.success(t("block.userUnblocked"));

        // Close dialogs
        setIsConfirming(false);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error(t("block.errorUnblocking"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmToggle = () => {
    setIsConfirming(!isConfirming);
  };

  // Show loading state
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#1b1c24] border-[#2f303b] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{t("block.manageBlocking")}</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex justify-center">
            <div className="animate-spin h-6 w-6 border-t-2 border-[#126319] rounded-full"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show confirmation screen
  if (isConfirming) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#1b1c24] border-[#2f303b] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {userHasBlocked
                ? t("block.confirmUnblock")
                : t("block.confirmBlock")}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {userHasBlocked
                ? t("block.confirmUnblockDescription", { name: userName })
                : t("block.confirmBlockDescription", { name: userName })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-4">
            <Button
              className="bg-[#2c2e3b] hover:bg-[#363848] text-white"
              onClick={handleConfirmToggle}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className={
                userHasBlocked
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }
              onClick={userHasBlocked ? handleUnblock : handleBlock}
            >
              {userHasBlocked ? t("block.unblock") : t("block.block")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Show main screen
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1b1c24] border-[#2f303b] text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{t("block.manageBlocking")}</DialogTitle>
        </DialogHeader>

        {userIsBlocked && (
          <div className="bg-red-900/20 p-4 rounded-md border border-red-800/30 mb-4">
            <div className="flex items-center text-red-400">
              <FaBan className="mr-2" />
              <p>{t("block.blocked.bothDirections")}</p>
            </div>
          </div>
        )}

        {userHasBlocked && (
          <div className="bg-red-900/20 p-4 rounded-md border border-red-800/30 mb-4">
            <div className="flex items-center text-red-400">
              <FaUserSlash className="mr-2" />
              <p>{t("block.blocking.bothDirections")}</p>
            </div>
          </div>
        )}

        <div className="py-4">
          {userHasBlocked ? (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleConfirmToggle}
            >
              <FaUnlock className="mr-2" />
              {t("block.unblock")}
            </Button>
          ) : (
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmToggle}
            >
              <FaUserSlash className="mr-2" />
              {t("block.block")}
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-400 mt-2 space-y-2">
          {!userHasBlocked && (
            <>
              <p>{t("block.blockingExplanation1")}</p>
              <p>{t("block.blockingExplanation2")}</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BlockUserDialog;
