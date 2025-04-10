import React, { useState } from "react";
import { RiCloseFill } from "react-icons/ri";
import { FaInfoCircle } from "react-icons/fa";
import { useChatStore } from "@/store/chatStore";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";
import GroupInfoDialog from "./group-info";
import BlockUserDialog from "../block-user-dialog";
import { useTranslation } from "react-i18next";
import { FaBan } from "react-icons/fa";

/**
 * Header component for chat that displays user/group info and action buttons
 */
function ChatInfo() {
  const { t } = useTranslation();
  const { closeChat, selectedChatData, selectedChatType } = useChatStore();
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const handleOpenGroupInfo = () => {
    setShowGroupInfo(true);
  };

  return (
    <div className="h-[10vh] border-b-2 border-[#2f2303b] flex items-center justify-between px-5">
      <div className="flex-1 flex items-center">
        {selectedChatType === "group" ? (
          <div className="flex items-center">
            <span className="text-2xl text-gray-500 mr-2">#</span>
            <div className="space-mono-regular text-lg text-white">
              {selectedChatData.name}
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full overflow-hidden mr-3">
              <Avatar>
                {selectedChatData.image ? (
                  <AvatarImage
                    src={`${HOST}/${selectedChatData.image}`}
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

        {/* Add Block/Unblock button for direct chats */}
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

      {/* Add Block User Dialog */}
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
