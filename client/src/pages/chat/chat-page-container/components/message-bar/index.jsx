import { useSocket } from "@/context/SocketContext";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef } from "react";
import { useState } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";
import { apiClient } from "@/lib/api-client.js";
import { SEND_FILE_ROUTE } from "@/utils/constants.js";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

function MessageBar() {
  const [message, setMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const { selectedChatType, selectedChatData } = useChatStore();
  const { user } = useAuthStore();
  const emojiRef = useRef();
  const socket = useSocket();
  const fileInputRef = useRef();
  const { t } = useTranslation();

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
    console.log("Send message attempt for:", {
      type: selectedChatType,
      groupData: selectedChatType === "group" ? selectedChatData : null,
    });

    // Controllo se il messaggio è vuoto
    if (!message.trim()) {
      console.error("Il messaggio è vuoto");
      return;
    }

    // Controllo più rigoroso per gruppi
    if (selectedChatType === "group" && selectedChatData) {
      // Controllo se l'utente non è più nel gruppo
      if (
        selectedChatData.isActive === false ||
        selectedChatData.userRemoved === true ||
        selectedChatData.userLeft === true
      ) {
        console.log("Cannot send message, group status:", {
          isActive: selectedChatData.isActive,
          userRemoved: selectedChatData.userRemoved,
          userLeft: selectedChatData.userLeft,
        });

        // Messaggi specifici in base allo stato
        if (selectedChatData.userRemoved) {
          toast.error(t("chat.cannotSendMessageRemovedFromGroup"));
        } else if (selectedChatData.userLeft) {
          toast.error(t("chat.cannotSendMessageLeftGroup"));
        } else {
          toast.error(t("chat.cannotSendMessageInactiveGroup"));
        }
        return;
      }
    }

    if (selectedChatType === "friend" && socket) {
      socket.emit("sendMessage", {
        sender: user._id,
        content: message,
        recipient: selectedChatData._id,
        messageType: "text",
        fileUrl: undefined,
      });
      setMessage("");
    } else if (selectedChatType === "group") {
      socket.emit("sendGroupMessage", {
        sender: user._id,
        content: message,
        messageType: "text",
        fileUrl: undefined,
        groupId: selectedChatData._id,
      });
    } else {
      console.error("Socket not connected or chat type not contact");
    }

    setMessage("");
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    try {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post(SEND_FILE_ROUTE, formData, {
          withCredentials: true,
        });

        if (response.status === 200 && response.data) {
          if (selectedChatType === "friend") {
            socket.emit("sendMessage", {
              sender: user._id,
              content: undefined,
              recipient: selectedChatData._id,
              messageType: "file",
              fileURL: response.data.filePath,
            });
          } else if (selectedChatType === "group") {
            socket.emit("sendGroupMessage", {
              sender: user._id,
              content: undefined,
              messageType: "file",
              fileURL: response.data.filePath,
              groupId: selectedChatData._id,
            });
          }
        }
      }
    } catch (error) {
      console.error("Errore nel caricamento del file", error);
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
        <button
          className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-transform transform hover:scale-110 active:scale-95"
          onClick={handleFileUpload}
        >
          <GrAttachment className="text-2xl" />
        </button>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <div className="realtive">
          <button
            className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-transform transform hover:scale-110 active:scale-95 mt-1"
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
        className={`bg-[#2c4e97] rounded-md flex items-center justify-center p-5
          focus:border-none focus:outline-none focus:text-white
          transition-transform duration-300 ease-in-out transform hover:bg-[#365fbc]
          hover:scale-105 active:scale-95 ${
            selectedChatType === "group" &&
            selectedChatData &&
            selectedChatData.isActive === false
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        onClick={handleSendMessage}
        disabled={
          selectedChatType === "group" &&
          selectedChatData &&
          selectedChatData.isActive === false
        }
      >
        <IoSend className="text-2xl" />
      </button>
    </div>
  );
}

export default MessageBar;
