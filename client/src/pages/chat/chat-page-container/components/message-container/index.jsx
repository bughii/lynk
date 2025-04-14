import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore"; // Make sure to add this import
import moment from "moment";
import { apiClient } from "@/lib/api-client";
import { GET_GROUP_MESSAGES, GET_MESSAGES_ROUTE } from "@/utils/constants";
import { HOST } from "@/utils/constants";
import { IoMdArrowRoundDown } from "react-icons/io";
import { FaFileArchive, FaBan } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

const FONT_SIZES = {
  small: "1rem",
  medium: "2rem",
  large: "3rem",
};

function MessageContainer() {
  const {
    selectedChatType,
    selectedChatData,
    selectedChatMessages,
    setSelectedChatMessages,
    chatColors,
  } = useChatStore();
  const { user } = useAuthStore(); // Get the current user
  const { t } = useTranslation();
  const scrollRef = useRef();

  const [showImage, setShowImage] = useState(false);
  const [imageURL, setImageURL] = useState(null);

  useEffect(() => {
    // Fetch messages for the selected chat
    const getMessages = async () => {
      try {
        const response = await apiClient.post(GET_MESSAGES_ROUTE, {
          id: selectedChatData._id,
          withCredentials: true,
        });
        // If the response contains messages, set them in the store
        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
        }
      } catch (error) {
        console.log({ error });
      }
    };

    const getGroupMessages = async () => {
      try {
        const response = await apiClient.get(
          `${GET_GROUP_MESSAGES}/${selectedChatData._id}`,
          {
            withCredentials: true,
          }
        );
        // If the response contains messages, set them in the store
        if (response.data.messages) {
          setSelectedChatMessages(response.data.messages);
        }
      } catch (error) {
        console.log({ error });
      }
    };

    if (selectedChatData._id) {
      if (selectedChatType === "friend") getMessages();
      else if (selectedChatType === "group") getGroupMessages();
    }
  }, [selectedChatData, selectedChatType, setSelectedChatMessages]);

  useEffect(() => {
    // Scroll to the bottom of the chat when a new message is received
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChatMessages, selectedChatData]);

  const renderSystemMessage = (message) => {
    let translatedContent = message.content;

    // Apply translations if needed
    if (message.content === "Group created") {
      translatedContent = t("notifications.groupCreated");
    } else if (message.content === "Group deleted") {
      translatedContent = t("notifications.groupDeletedByAdmin");
    }

    return (
      <div className="flex justify-center my-4">
        <div className="bg-[#3b3c48]/30 rounded-md px-4 py-2 max-w-[85%] text-center">
          <p className="text-gray-300 text-sm font-medium">
            {translatedContent}
          </p>
          {message.timestamp && (
            <span className="text-xs text-gray-500 mt-1 block">
              {moment(message.timestamp).format("LT")}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderMessages = () => {
    let lastDate = null;
    return selectedChatMessages.map((message, index) => {
      const messageDate = moment(message.timestamp).format("YYYY-MM-DD");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;

      // Check for system flag in both potential locations:
      const isSystemMessage = message.isSystem || message.appearance?.isSystem;

      if (isSystemMessage) {
        return (
          <div key={index}>
            {showDate && (
              <div className="text-center text-gray-500 my-2">
                {moment(message.timestamp).format("LL")}
              </div>
            )}
            {renderSystemMessage(message)}
          </div>
        );
      } else {
        return (
          <div key={index}>
            {showDate && (
              <div className="text-center text-gray-500 my-2">
                {moment(message.timestamp).format("LL")}
              </div>
            )}
            {selectedChatType === "friend"
              ? renderDMMessages(message)
              : renderGroupMessages(message)}
          </div>
        );
      }
    });
  };

  const checkIfImage = (filePath) => {
    // Check if the file is an image based on the file extension
    const imageRegex = /\.(jpeg|jpg|gif|png|svg|webp)$/i;
    return imageRegex.test(filePath);
  };

  const downloadFile = async (url) => {
    // Send HTTP request to retrieve the file from the server
    const response = await apiClient.get(`${HOST}/${url}`, {
      responseType: "blob", // Binary data (blob)
    });

    // Create a blob from the response data
    const urlBlob = window.URL.createObjectURL(new Blob([response.data]));

    // Create a link element to trigger the download
    const link = document.createElement("a");

    // Set the href of the link to the blob URL
    link.href = urlBlob;

    // Set the download attribute to the file name
    link.setAttribute("download", url.split("/").pop());

    // Append the link to the body and click it to trigger the download
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(urlBlob);
  };

  const renderDMMessages = (message) => {
    // If the message already has the processed flag from socket, use it
    // Otherwise, determine based on sender ID comparison
    const isCurrentUserSender =
      message.isCurrentUserSender !== undefined
        ? message.isCurrentUserSender
        : message.sender._id === user._id;

    return (
      <div className={`${isCurrentUserSender ? "text-right" : "text-left"}`}>
        {message.messageType === "text" && (
          <div
            style={{
              backgroundColor: isCurrentUserSender
                ? "rgba(22, 66, 91, 0.05)"
                : "rgba(42, 43, 51, 0.05)",
              borderColor: isCurrentUserSender
                ? chatColors.sentMessageColor
                : chatColors.receivedMessageColor,
              color: isCurrentUserSender
                ? chatColors.sentMessageColor
                : chatColors.receivedMessageColor,
              fontSize: FONT_SIZES[chatColors.fontSize] || FONT_SIZES.medium,
              opacity: message.isBlocked ? 0.7 : 1,
            }}
            className="border inline-block p-4 rounded my-1 max-w-[50%] break-words"
          >
            {message.content}

            {/* Block indicator logic stays the same */}
            {message.isBlocked && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block ml-2 text-red-500">
                      <FaBan size={14} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1c1b1e] border-none p-3 text-white">
                    {message.blockedByUser
                      ? t("block.messageNotDeliveredYouBlocked")
                      : t("block.messageNotDeliveredYouAreBlocked")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        {message.messageType === "file" && (
          <div
            style={{
              backgroundColor: isCurrentUserSender
                ? "rgba(22, 66, 91, 0.05)"
                : "rgba(42, 43, 51, 0.05)",
              borderColor: isCurrentUserSender
                ? chatColors.sentMessageColor
                : chatColors.receivedMessageColor,
              color: isCurrentUserSender
                ? chatColors.sentMessageColor
                : chatColors.receivedMessageColor,
              opacity: message.isBlocked ? 0.7 : 1,
            }}
            className="border inline-block p-4 rounded my-1 max-w-[50%] break-words"
          >
            {checkIfImage(message.fileURL) ? (
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowImage(true);
                  setImageURL(message.fileURL);
                }}
              >
                <img
                  src={`${HOST}/${message.fileURL}`}
                  alt="file"
                  height={300}
                  width={300}
                  className={message.isBlocked ? "opacity-70" : ""}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <span className="text-3xl bg-black/20 rounded full p-3">
                  <FaFileArchive />
                </span>
                <span>
                  {message.fileURL.split("/").pop().length > 30
                    ? message.fileURL.split("/").pop().substring(0, 27) + "..."
                    : message.fileURL.split("/").pop()}
                </span>
                <span
                  className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
                  onClick={() => downloadFile(message.fileURL)}
                >
                  <IoMdArrowRoundDown />
                </span>
              </div>
            )}

            {/* Block indicator for file messages */}
            {message.isBlocked && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="absolute top-2 right-2 text-red-500">
                      <FaBan size={14} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#1c1b1e] border-none p-3 text-white">
                    {message.blockedByUser
                      ? t("block.messageNotDeliveredYouBlocked")
                      : t("block.messageNotDeliveredYouAreBlocked")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
        <div className="text-xs text-gray-500">
          {moment(message.timestamp).format("LT")}
        </div>
      </div>
    );
  };

  const renderGroupMessages = (message) => {
    const currentUserId = user._id.toString();
    const isCurrentUser = message.sender?._id === currentUserId;
    const senderName = message.sender.userName || "Unknown User";

    return (
      <div
        className={`flex items-start gap-3 my-4 ${
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {!isCurrentUser && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            {message.sender.image ? (
              <AvatarImage
                src={`${HOST}/${message.sender.image}`}
                alt="profile-image"
                className="object-cover w-full h-full bg-black"
              />
            ) : (
              <AvatarImage
                src={getAvatar(message.sender.avatar)}
                alt="avatar"
                className="object-cover w-full h-full"
              />
            )}
          </Avatar>
        )}

        <div
          className={`flex flex-col ${
            isCurrentUser ? "items-end" : "items-start"
          } max-w-[50%]`}
        >
          {!isCurrentUser && (
            <span className="text-sm text-gray-500 mb-1">{senderName}</span>
          )}

          <div
            style={{
              backgroundColor: isCurrentUser
                ? "rgba(42, 43, 51, 0.05)"
                : "rgba(22, 66, 91, 0.05)",
              borderColor: isCurrentUser
                ? chatColors.sentMessageColor
                : chatColors.receivedMessageColor,
              color: isCurrentUser
                ? chatColors.sentMessageColor
                : chatColors.receivedMessageColor,
              fontSize: FONT_SIZES[chatColors.fontSize] || FONT_SIZES.medium,
            }}
            className="border p-3 rounded-lg break-words"
          >
            {message.messageType === "text" && message.content}
            {message.messageType === "file" &&
              (checkIfImage(message.fileURL) ? (
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setShowImage(true);
                    setImageURL(message.fileURL);
                  }}
                >
                  <img
                    src={`${HOST}/${message.fileURL}`}
                    alt="file"
                    className="max-h-[300px] w-auto rounded"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xl bg-black/20 rounded-full p-2">
                    <FaFileArchive />
                  </span>
                  <span className="flex-1 truncate">
                    {message.fileURL.split("/").pop().length > 30
                      ? message.fileURL.split("/").pop().substring(0, 27) +
                        "..."
                      : message.fileURL.split("/").pop()}
                  </span>
                  <button
                    className="bg-black/20 p-2 text-xl rounded-full hover:bg-black/50 transition-all duration-300"
                    onClick={() => downloadFile(message.fileURL)}
                  >
                    <IoMdArrowRoundDown />
                  </button>
                </div>
              ))}
          </div>

          <div className="text-xs text-gray-500 mt-1">
            {moment(message.timestamp).format("LT")}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hidden p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full">
      {renderMessages()}
      <div ref={scrollRef} />
      {showImage && (
        <div className="fixed z-[1000] top-0 left-0 h-[100vh] w-[100vw] flex items-center justify-center backdrop-blur-lg flex-col">
          <div>
            <img
              src={`${HOST}/${imageURL}`}
              className="h-[80vh] w-full bg-cover"
            />
          </div>
          <div className="flex gap-5 fixed top-0 mt-5">
            <button
              className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
              onClick={() => downloadFile(imageURL)}
            >
              <IoMdArrowRoundDown />
            </button>
            <button
              className="bg-black/20 p-3 text-2xl rounded-full hover:bg-black/50 cursor-pointer transition-all duration-300"
              onClick={() => {
                setShowImage(false);
                setImageURL(null);
              }}
            >
              <IoCloseSharp />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageContainer;
