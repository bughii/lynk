import { useChatStore } from "@/store/chatStore";
import { ScrollArea } from "./ui/scroll-area";

function GroupPreview({ groups, isChannel }) {
  const {
    selectedChatData,
    setSelectedChatData,
    setSelectedChatType,
    setSelectedChatMessages,
  } = useChatStore();

  const handleClick = (group) => {
    setSelectedChatType("group");
    setSelectedChatData(group);

    if (selectedChatData && selectedChatData._id !== group._id) {
      setSelectedChatMessages([]); // Resetta i messaggi se cambia il gruppo
    }
  };

  return (
    <div>
      <ScrollArea className="h-[250px] overflow-y-auto">
        <div className="mt-5">
          {groups.map((group) => (
            <div
              key={group._id}
              className={`pl-5 py-2 transition-all duration-300 cursor-pointer ${
                selectedChatData && selectedChatData._id === group._id
                  ? "bg-[#8417ff] hover:bg-[#8317ff]"
                  : "hover:bg-[#f1f1ff111]"
              }`}
              onClick={() => handleClick(group)}
            >
              <div className="flex gap-5 items-center justify-start text-neutral-300">
                {/* Simbolo # con stili aggiornati */}
                <span className="text-2xl text-gray-500">#</span>
                <div className="space-mono-regular text-lg text-white">
                  {group.name ? `${group.name}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default GroupPreview;
