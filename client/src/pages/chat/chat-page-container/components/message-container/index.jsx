import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import moment from "moment";
import { apiClient } from "@/lib/api-client";
import { GET_GROUP_MESSAGES, GET_MESSAGES_ROUTE } from "@/utils/constants";
import { HOST } from "@/utils/constants";
import { IoMdArrowRoundDown } from "react-icons/io";
import { FaFileArchive } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/utils";

const FONT_SIZES = {
  small: "1rem", // 14px
  medium: "2rem", // 16px
  large: "3rem", // 18px
};

function MessageContainer() {
  const {
    selectedChatType,
    selectedChatData,
    selectedChatMessages,
    setSelectedChatMessages,
    chatColors,
  } = useChatStore();
  const { user } = useAuthStore();
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

  const renderSystemMessage = (message) => (
    <div className="text-center my-4">
      <div className="inline-block bg-red-500/20 text-red-400 px-4 py-2 rounded-md text-sm">
        {message.content}
      </div>
    </div>
  );

  const renderMessages = () => {
    let lastDate = null;

    // Iterate through the messages and render them with date dividers
    return selectedChatMessages.map((message, index) => {
      const messageDate = moment(message.timestamp).format("YYYY-MM-DD");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;

      return (
        <div key={index}>
          {showDate && (
            <div className="text-center text-gray-500 my-2">
              {moment(message.timestamp).format("LL")}
            </div>
          )}
          {message.isSystem
            ? renderSystemMessage(message)
            : selectedChatType === "friend"
            ? renderDMMessages(message)
            : renderGroupMessages(message)}
        </div>
      );
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

  const renderDMMessages = (message) => (
    <div
      className={`${
        message.sender === selectedChatData._id ? "text-left" : "text-right"
      }`}
    >
      {message.messageType === "text" && (
        <div
          style={{
            backgroundColor:
              message.sender !== selectedChatData._id
                ? "rgba(42, 43, 51, 0.05)"
                : "rgba(22, 66, 91, 0.05)",
            borderColor:
              message.sender !== selectedChatData._id
                ? chatColors.sentMessageColor
                : chatColors.receivedMessageColor,
            color:
              message.sender !== selectedChatData._id
                ? chatColors.sentMessageColor
                : chatColors.receivedMessageColor,
            fontSize: FONT_SIZES[chatColors.fontSize] || FONT_SIZES.medium,
          }}
          className="border inline-block p-4 rounded my-1 max-w-[50%] break-words"
        >
          {message.content}
        </div>
      )}
      {message.messageType === "file" && (
        <div
          style={{
            backgroundColor:
              message.sender !== selectedChatData._id
                ? "rgba(42, 43, 51, 0.05)"
                : "rgba(22, 66, 91, 0.05)",
            borderColor:
              message.sender !== selectedChatData._id
                ? chatColors.sentMessageColor
                : chatColors.receivedMessageColor,
            color:
              message.sender !== selectedChatData._id
                ? chatColors.sentMessageColor
                : chatColors.receivedMessageColor,
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
        </div>
      )}
      <div className="text-xs text-gray-500">
        {moment(message.timestamp).format("LT")}
      </div>
    </div>
  );

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
