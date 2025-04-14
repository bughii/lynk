import { useChatStore } from "@/store/chatStore";
import { Avatar, AvatarImage } from "./ui/avatar";
import { HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { useFriendStore } from "@/store/friendStore";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

function ChatPreview() {
  const {
    selectedChatData,
    setSelectedChatData,
    setSelectedChatType,
    setSelectedChatMessages,
    unreadMessagesCount,
    resetUnreadCount,
  } = useChatStore();

  const { friendsPreview } = useFriendStore();
  const { t } = useTranslation();

  const handleClick = (friend) => {
    console.log("Clicked on chat:", friend);

    setSelectedChatType("friend");

    // Only update if selecting a different chat
    if (!selectedChatData || selectedChatData._id !== friend._id) {
      setSelectedChatData(friend);
      setSelectedChatMessages([]);

      // Reset unread count for this specific friend
      if (friend && friend._id) {
        console.log("Resetting unread count for:", friend._id);
        resetUnreadCount(friend._id);
      }
    }
  };

  // Animation variants for list items
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
      },
    }),
  };

  return (
    <ScrollArea className="h-[calc(100vh-320px)] overflow-y-auto px-2">
      <div className="py-2">
        {friendsPreview.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("chatPreview.emptyChats")}
          </div>
        ) : (
          friendsPreview.map((friend, i) => {
            const unreadCount = unreadMessagesCount[friend._id] || 0;
            const isSelected =
              selectedChatData && selectedChatData._id === friend._id;

            return (
              <motion.div
                custom={i}
                initial="hidden"
                animate="visible"
                variants={variants}
                key={friend._id}
                className={`mb-2 p-3 rounded-lg transition-all duration-200 cursor-pointer flex items-center ${
                  isSelected
                    ? "bg-[#126319] hover:bg-[#107016]"
                    : "hover:bg-[#2a2b33]"
                }`}
                onClick={() => handleClick(friend)}
              >
                <div className="relative mr-3">
                  <Avatar className="h-12 w-12 rounded-full overflow-hidden border-2 border-[#2f303b]">
                    {friend.image ? (
                      <AvatarImage
                        src={`${HOST}/${friend.image}`}
                        alt="profile-image"
                        className="object-cover w-full h-full bg-black"
                      />
                    ) : (
                      <AvatarImage
                        src={getAvatar(friend.avatar)}
                        alt="avatar"
                        className="object-cover w-full h-full"
                      />
                    )}
                  </Avatar>

                  {/* Online indicator */}
                  <div
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#1b1c24] ${
                      friend.isOnline ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="space-mono-regular text-white font-medium truncate">
                      {friend.userName || ""}
                    </span>

                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm truncate">
                    {t("chatPreview.previewPlaceholder")}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}

export default ChatPreview;
