import React, { useState, useEffect } from "react";
import { RiCloseFill } from "react-icons/ri";
import { FaInfoCircle, FaBan } from "react-icons/fa";
import { useChatStore } from "@/store/chatStore";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/utils";
import GroupInfoDialog from "./group-info";
import BlockUserDialog from "../block-user-dialog";
import { useTranslation } from "react-i18next";
import { getProfileImage } from "@/lib/getProfileImage";

/**
 * Header component for chat that displays user/group info and action buttons
 */

function ChatInfo() {
  const { t } = useTranslation();
  const {
    closeChat,
    selectedChatData,
    selectedChatType,
    blockedUsers,
    blockedByUsers,
  } = useChatStore();

  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  // Track block status for internal use only - not for display
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlocked, setHasBlocked] = useState(false);

  // Update block status whenever relevant state changes
  useEffect(() => {
    if (selectedChatType === "friend" && selectedChatData) {
      const userId = selectedChatData._id;
      setHasBlocked(blockedUsers.includes(userId));
      setIsBlocked(blockedByUsers.includes(userId));
    }
  }, [
    selectedChatData,
    selectedChatType,
    blockedUsers,
    blockedByUsers,
    // Also react to any timestamp changes in the selectedChatData
    selectedChatData?._blockTimestamp,
    selectedChatData?._blockActionCompleted,
  ]);

  const handleOpenGroupInfo = () => {
    setShowGroupInfo(true);
  };

  const finalImageSrc = getProfileImage(
    selectedChatData?.image,
    selectedChatData?.avatar
  );

  return (
    <div className="h-[10vh] border-b-2 border-[#2f2303b] flex items-center justify-between px-5">
      <div className="flex-1 flex items-center min-w-0">
        {selectedChatType === "group" ? (
          <div className="flex items-center">
            <span className="text-2xl text-gray-500 mr-2">#</span>
            <div className="space-mono-regular text-lg text-white truncate">
              {selectedChatData.name}
            </div>
          </div>
        ) : (
          <div className="flex items-center min-w-0">
            <div className="h-12 w-12 rounded-full overflow-hidden mr-3">
              <Avatar>
                {selectedChatData.image ? (
                  <AvatarImage
                    key={finalImageSrc}
                    src={finalImageSrc || undefined}
                    alt="profile-image"
                    className="object-cover w-full h-full bg-black"
                  />
                ) : (
                  <AvatarImage
                    src={getAvatar(selectedChatData.avatar)}
                    alt="avatar"
                    className="object-cover w-full h-full"
                  />
                )}
              </Avatar>
            </div>
            <div className="space-mono-regular">
              {selectedChatData.userName}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {selectedChatType === "group" && (
          <button
            className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all"
            onClick={handleOpenGroupInfo}
            title="Group Information"
          >
            <FaInfoCircle className="text-2xl" />
          </button>
        )}

        {/* Block/Unblock button for direct chats */}
        {selectedChatType === "friend" && (
          <button
            className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all"
            onClick={() => setShowBlockDialog(true)}
            title={t("block.manageBlocking")}
          >
            <FaBan className="text-2xl" />
          </button>
        )}

        <button
          className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all"
          onClick={closeChat}
        >
          <RiCloseFill className="text-3xl" />
        </button>
      </div>

      {selectedChatType === "group" && showGroupInfo && (
        <GroupInfoDialog
          open={showGroupInfo}
          onOpenChange={setShowGroupInfo}
          group={selectedChatData}
        />
      )}

      {/* Block User Dialog */}
      {selectedChatType === "friend" && (
        <BlockUserDialog
          open={showBlockDialog}
          onOpenChange={setShowBlockDialog}
          userId={selectedChatData._id}
          userName={selectedChatData.userName}
        />
      )}
    </div>
  );
}

export default ChatInfo;
