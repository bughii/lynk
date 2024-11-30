import { useChatStore } from "@/store/chatStore";
import { ScrollArea } from "./ui/scroll-area";

function GroupPreview({ groups, isChannel }) {
  const {
    selectedChatData,
    setSelectedChatData,
    setSelectedChatType,
    setSelectedChatMessages,
    unreadGroupMessagesCount,
    resetGroupUnreadCount,
  } = useChatStore();

  const handleClick = (group) => {
    console.log("Clicked on group:", group);

    setSelectedChatType("group");
    if (!selectedChatData || selectedChatData._id !== group._id) {
      setSelectedChatData(group);
      setSelectedChatMessages([]); // Clear previous messages
      console.log("Resetting unread group count for:", group._id);
      resetGroupUnreadCount(group._id); // This should mark the group messages as read
    }
  };

  return (
    <ScrollArea className="h-[calc(30vh-40px)] overflow-y-auto">
      <div className="mt-5">
        {groups.map((group) => {
          const unreadCount = unreadGroupMessagesCount[group._id] || 0;

          return (
            <div
              key={group._id}
              className={`pl-5 py-2 transition-all duration-300 cursor-pointer ${
                selectedChatData && selectedChatData._id === group._id
                  ? "bg-[#126319] hover:bg-[#126319]"
                  : "hover:bg-[#f1f1ff111]"
              }`}
              onClick={() => handleClick(group)}
            >
              <div className="flex gap-5 items-center justify-start text-neutral-300">
                <span className="text-2xl text-gray-500">#</span>
                <div className="space-mono-regular text-lg text-white flex items-center gap-2">
                  {group.name}
                  {unreadCount > 0 && (
                    <span className="ml-2 text-red-500">({unreadCount})</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export default GroupPreview;
