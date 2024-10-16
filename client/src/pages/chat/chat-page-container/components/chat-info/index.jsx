import React from "react";
import { RiCloseFill } from "react-icons/ri";
import { useChatStore } from "@/store/chatStore";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";

function ChatInfo() {
  const { closeChat, selectedChatData, selectedChatType } = useChatStore();

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
      <button
        className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all"
        onClick={closeChat}
      >
        <RiCloseFill className="text-3xl" />
      </button>
    </div>
  );
}

export default ChatInfo;
