import React, { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ContactsListContainer from "./contacts-list";
import EmptyChatContainer from "./empty-chat-page-container";
import ChatPageContainer from "./chat-page-container";
import { getAvatar } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore";

const Chat = () => {
  const { user } = useAuthStore();
  const { selectedChatType } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      console.log("Avatar aggiornato: ", user.avatar);
      getAvatar(user.avatar);
    }
  }, [user.avatar]);

  return (
    <div className="flex h-[100vh] text-white overflow-hidden">
      <ContactsListContainer />
      {selectedChatType === undefined ? (
        <EmptyChatContainer />
      ) : (
        <ChatPageContainer />
      )}
      {/*<EmptyChatContainer />*/}
      {/*<ChatPageContainer />*/}
    </div>
  );
};

export default Chat;
