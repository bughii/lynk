import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlockStatus } from "@/hooks/useBlockStatus";
import { useSocket } from "@/context/SocketContext";
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
 * Dialog component to manage blocking/unblocking a user
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onOpenChange - Function to change open state
 * @param {string} props.userId - ID of the user to block/unblock
 * @param {string} props.userName - Name of the user to block/unblock
 */
function BlockUserDialog({ open, onOpenChange, userId, userName }) {
  const { t } = useTranslation();
  const socket = useSocket();
  const [isConfirming, setIsConfirming] = useState(false);
  const {
    loading,
    userHasBlocked,
    userIsBlocked,
    blockUser,
    unblockUser,
    refreshStatus,
  } = useBlockStatus(userId);

  const handleBlock = async () => {
    const success = await blockUser();
    if (success && socket) {
      socket.emit("userBlocked", { blockedUserId: userId });
      setIsConfirming(false);
    }
  };

  const handleUnblock = async () => {
    const success = await unblockUser();
    if (success && socket) {
      socket.emit("userUnblocked", { blockedUserId: userId });
      setIsConfirming(false);
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
              <p>{t("block.blocking.bothDirections", { name: userName })}</p>
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
