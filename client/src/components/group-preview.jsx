import { useChatStore } from "@/store/chatStore";
import { ScrollArea } from "./ui/scroll-area";
import { motion } from "framer-motion";
import { FaHashtag } from "react-icons/fa";
import { useTranslation } from "react-i18next";

function GroupPreview({ groups }) {
  const {
    selectedChatData,
    setSelectedChatData,
    setSelectedChatType,
    setSelectedChatMessages,
    unreadGroupMessagesCount,
    resetGroupUnreadCount,
  } = useChatStore();

  const { t } = useTranslation();

  const handleClick = (group) => {
    console.log("Clicked on group:", group);

    // Set chat type to group
    setSelectedChatType("group");

    // Only update if selecting a different group
    if (!selectedChatData || selectedChatData._id !== group._id) {
      setSelectedChatData(group);
      setSelectedChatMessages([]);

      // Reset unread count for this specific group
      if (group && group._id) {
        console.log("Resetting unread group count for:", group._id);
        resetGroupUnreadCount(group._id);
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
        {groups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("groupPreview.emptyGroups")}
          </div>
        ) : (
          groups.map((group, i) => {
            const unreadCount = unreadGroupMessagesCount[group._id] || 0;
            const isSelected =
              selectedChatData && selectedChatData._id === group._id;

            // Handle group status flags for UI feedback
            const isInactive = group.isActive === false;
            const isDeleted = group.isDeleted === true;
            const userRemoved = group.userRemoved === true;
            const userLeft = group.userLeft === true;

            let statusClass = "";
            let statusMessage = "";

            if (isDeleted) {
              statusClass = "text-red-500 italic";
              statusMessage = "Deleted";
            } else if (userRemoved) {
              statusClass = "text-red-500 italic";
              statusMessage = "Removed";
            } else if (userLeft) {
              statusClass = "text-yellow-500 italic";
              statusMessage = "Left";
            } else if (isInactive) {
              statusClass = "text-gray-500 italic";
              statusMessage = "Inactive";
            }

            return (
              <motion.div
                custom={i}
                initial="hidden"
                animate="visible"
                variants={variants}
                key={`${group._id}-${i}`}
                className={`mb-2 p-3 rounded-lg transition-all duration-200 cursor-pointer flex items-center ${
                  isSelected
                    ? "bg-[#126319] hover:bg-[#107016]"
                    : "hover:bg-[#2a2b33]"
                } ${isInactive ? "opacity-75" : ""}`}
                onClick={() => handleClick(group)}
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#2f303b] mr-3 text-[#126319]">
                  <FaHashtag size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span
                      className={`space-mono-regular text-white font-medium truncate ${statusClass}`}
                    >
                      {group.name}
                      {statusMessage && (
                        <span className="ml-2">({statusMessage})</span>
                      )}
                    </span>

                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm truncate">
                    {t("groupPreview.previewPlaceholder")}
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

export default GroupPreview;
