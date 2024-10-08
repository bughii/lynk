import React from "react";
import { RiCloseFill } from "react-icons/ri";
import { useChatStore } from "@/store/chatStore";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";

function ChatInfo() {
  const { closeChat, selectedChatData } = useChatStore();

  return (
    <div className="h-[10vh] border-b-2 border-[#2f2303b] flex items-center justify-between px-5">
      <div className="flex gap-5 items-center">
        <div className="flex gap-3 items-center justify-center">
          <div className="h-12 w-12 rounded-full overflow-hidden">
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
          <div className="flex items-center">
            <div className="space-mono-regular ml-2">
              {selectedChatData.userName ? `${selectedChatData.userName}` : ""}
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center">
          <button
            className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all"
            onClick={closeChat}
          >
            <RiCloseFill className="text-3xl" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInfo;
