import { useSocket } from "@/context/SocketContext";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import EmojiPicker from "emoji-picker-react";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";

function MessageBar() {
  const [message, setMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const { selectedChatType, selectedChatData } = useChatStore();
  const { user } = useAuthStore();
  const emojiRef = useRef();
  const socket = useSocket();

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiRef]);

  const handleSendMessage = async () => {
    console.log("Socket: ", socket);
    console.log("Selected chat type: ", selectedChatType);
    console.log("Selected chat data: ", selectedChatData);
    if (selectedChatType === "friend" && socket) {
      socket.emit("sendMessage", {
        sender: user._id,
        content: message,
        recipient: selectedChatData._id,
        messageType: "text",
        fileUrl: undefined,
      });
      setMessage("");
    } else {
      console.error("Socket not connected or chat type not contact");
    }
  };

  const handleAddEmoji = (emoji) => {
    setMessage((msg) => msg + emoji.emoji);
  };
  return (
    <div className="h-[10vh] bg-[#1c1d25] flex justify-center items-center px-8 mb-6 gap-6">
      <div className="flex-1 flex bg-[#2a2b33] rounded-md items-center gap-5 pr-5 pb-2">
        <input
          type="text"
          className="flex-1 p-5 bg-transparent rounded-md focus:border-none focus:outline-none"
          placeholder="Scrivi un messaggio"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all">
          <GrAttachment className="text-2xl" />
        </button>
        <div className="realtive">
          <button
            className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all"
            onClick={() => setEmojiPickerOpen(true)}
          >
            <RiEmojiStickerLine className="text-2xl" />
          </button>
          <div className="absolute bottom-16 right-0" ref={emojiRef}>
            <EmojiPicker
              theme="dark"
              open={emojiPickerOpen}
              onEmojiClick={handleAddEmoji}
              autoFocusSearch={false}
            />
          </div>
        </div>
      </div>
      <button
        className="bg-[#2c4e97] rounded-md flex items-center justify-center p-5 
             focus:border-none focus:outline-none focus:text-white 
             transition-transform duration-300 ease-in-out transform hover:bg-[#365fbc] 
             hover:scale-105 active:scale-95"
        onClick={handleSendMessage}
      >
        <IoSend className="text-2xl" />
      </button>
    </div>
  );
}

export default MessageBar;
