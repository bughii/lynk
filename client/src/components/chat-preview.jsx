import { useChatStore } from "@/store/chatStore";
import { Avatar, AvatarImage } from "./ui/avatar";
import { HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { useFriendStore } from "@/store/friendStore";

function ChatPreview({ isChannel = false }) {
  const {
    selectedChatData,
    setSelectedChatData,
    setSelectedChatType,
    setSelectedChatMessages,
    unreadMessagesCount,
    resetUnreadCount,
  } = useChatStore();

  const { friendsPreview } = useFriendStore();

  const handleClick = (friend) => {
    console.log("Clicked on chat:", friend);

    if (isChannel) {
      setSelectedChatType("channel");
    } else {
      setSelectedChatType("friend");
    }

    if (!selectedChatData || selectedChatData._id !== friend._id) {
      setSelectedChatData(friend);
      setSelectedChatMessages([]);
      console.log("Resetting unread count for:", friend._id);
      resetUnreadCount(friend._id); // This should mark the messages as read
    }
  };

  return (
    <div>
      <ScrollArea className="h-[100px] overflow-y-auto">
        <div className="mt-5">
          {friendsPreview.map((friend) => {
            const unreadCount = unreadMessagesCount[friend._id] || 0;
            return (
              <div
                key={friend._id}
                className={`pl-5 py-2 transition-all duration-300 cursor-pointer ${
                  selectedChatData && selectedChatData._id === friend._id
                    ? "bg-[#126319] hover:bg-[#126319]"
                    : "hover:bg-[#f1f1ff111]"
                }`}
                onClick={() => handleClick(friend)}
              >
                <div className="flex gap-5 items-center justify-start text-neutral-300">
                  <div className="relative">
                    <Avatar className="h-10 w-10 rounded-full overflow-hidden">
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
                    <div
                      className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${
                        friend.isOnline ? "bg-green-500" : "bg-gray-500"
                      }`}
                    />
                  </div>
                  <div className="space-mono-regular text-white">
                    {friend.userName ? `${friend.userName}` : ""}
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
    </div>
  );
}

export default ChatPreview;
