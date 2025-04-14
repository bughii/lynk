import { useSocket } from "@/context/SocketContext";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";
import { FaBan } from "react-icons/fa";
import { apiClient } from "@/lib/api-client.js";
import { SEND_FILE_ROUTE } from "@/utils/constants.js";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

function MessageBar() {
  const [message, setMessage] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const { selectedChatType, selectedChatData, blockedUsers, blockedByUsers } =
    useChatStore();
  const { user } = useAuthStore();
  const emojiRef = useRef();
  const socket = useSocket();
  const fileInputRef = useRef();
  const { t } = useTranslation();

  // Track block status with state to ensure UI updates
  const [isBlocked, setIsBlocked] = useState(false);
  const [userHasBlocked, setUserHasBlocked] = useState(false);
  const [userIsBlocked, setUserIsBlocked] = useState(false);

  // Update block status whenever relevant state changes
  useEffect(() => {
    if (selectedChatType === "friend" && selectedChatData) {
      const userId = selectedChatData._id;
      const hasBlocked = blockedUsers.includes(userId);
      const isBlocked = blockedByUsers.includes(userId);

      setUserHasBlocked(hasBlocked);
      setUserIsBlocked(isBlocked);
      setIsBlocked(hasBlocked || isBlocked);
    } else {
      setIsBlocked(false);
      setUserHasBlocked(false);
      setUserIsBlocked(false);
    }
  }, [
    selectedChatData,
    selectedChatType,
    blockedUsers,
    blockedByUsers,
    // Also react to any timestamp changes in the selectedChatData
    selectedChatData?._blockTimestamp,
    selectedChatData?._blockActionCompleted,
    selectedChatData?._isBlockedByUser,
  ]);

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

  useEffect(() => {
    setMessage("");
  }, [selectedChatData, selectedChatType]);

  const handleSendMessage = async () => {
    // Check if message is empty
    if (!message.trim()) {
      return;
    }

    // Check if this is a direct message that is blocked
    if (selectedChatType === "friend" && isBlocked) {
      toast.error(t("block.messagesWontBeDelivered"));
      return;
    }

    // Group message handling
    if (selectedChatType === "group" && selectedChatData) {
      if (
        selectedChatData.isDeleted ||
        selectedChatData.isActive === false ||
        selectedChatData.userRemoved === true ||
        selectedChatData.userLeft === true
      ) {
        if (selectedChatData.isDeleted) {
          toast.error(t("chat.cannotSendMessageDeletedGroup"));
        } else if (selectedChatData.userRemoved) {
          toast.error(t("chat.cannotSendMessageRemovedFromGroup"));
        } else if (selectedChatData.userLeft) {
          toast.error(t("chat.cannotSendMessageLeftGroup"));
        } else {
          toast.error(t("chat.cannotSendMessageInactiveGroup"));
        }
        return;
      }
    }

    // Direct message handling
    if (selectedChatType === "friend" && socket) {
      socket.emit("sendMessage", {
        sender: user._id,
        content: message,
        recipient: selectedChatData._id,
        messageType: "text",
      });
      setMessage("");
    } else if (selectedChatType === "group") {
      socket.emit("sendGroupMessage", {
        sender: user._id,
        content: message,
        messageType: "text",
        groupId: selectedChatData._id,
      });
      setMessage("");
    } else {
      console.error("Socket not connected or chat type not recognized");
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    // Check if this is a direct message that is blocked
    if (selectedChatType === "friend" && isBlocked) {
      toast.error(t("block.messagesWontBeDelivered"));
      return;
    }

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
      console.error("Error uploading file", error);
    }
  };

  const handleAddEmoji = (emoji) => {
    setMessage((msg) => msg + emoji.emoji);
  };

  // Only show a block banner if we're in a direct message that's blocked
  const shouldShowBlockBanner = selectedChatType === "friend" && isBlocked;

  // Get the appropriate block message
  const getBlockMessage = () => {
    if (userHasBlocked) {
      return t("block.messagesWontBeDeliveredBlocked");
    } else if (userIsBlocked) {
      return t("block.messagesWontBeDeliveredYouAreBlocked");
    }
    return t("block.messagesWontBeDelivered");
  };

  return (
    <>
      {/* Only show one block banner at the top of the message bar */}
      {shouldShowBlockBanner && (
        <div className="bg-amber-900/20 text-amber-400 py-2 px-6 rounded-xl inline-flex items-center justify-center mx-auto mb-4 w-fit">
          <FaBan className="mr-2 text-lg" />
          <span className="text-base">{getBlockMessage()}</span>
        </div>
      )}

      <div className="h-[10vh] bg-[#1c1d25] flex justify-center items-center px-8 mb-6 gap-6">
        <div className="flex-1 flex bg-[#2a2b33] rounded-md items-center gap-5 pr-5 pb-2">
          <input
            type="text"
            className="flex-1 p-5 bg-transparent rounded-md focus:border-none focus:outline-none"
            placeholder={
              isBlocked
                ? t("block.messagesWontBeDelivered")
                : t("messageBar.writeMessage")
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className={`text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-transform transform hover:scale-110 active:scale-95 ${
              isBlocked ? "opacity-50 cursor-not-allowed" : ""
            }`}
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
          <div className="relative">
            <button
              className={`text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-transform transform hover:scale-110 active:scale-95 mt-1 ${
                isBlocked ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={() => setEmojiPickerOpen(true)}
            >
              <RiEmojiStickerLine className="text-2xl" />
            </button>
            <div className="absolute bottom-16 right-0" ref={emojiRef}>
              <EmojiPicker
                theme="dark"
                open={emojiPickerOpen && !isBlocked}
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
              (selectedChatData.isActive === false ||
                selectedChatData.isDeleted)
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          onClick={handleSendMessage}
          disabled={
            selectedChatType === "group" &&
            selectedChatData &&
            (selectedChatData.isActive === false || selectedChatData.isDeleted)
          }
        >
          <IoSend className="text-2xl" />
        </button>
      </div>
    </>
  );
}

export default MessageBar;
