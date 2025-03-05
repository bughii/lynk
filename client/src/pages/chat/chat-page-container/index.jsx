import React from "react";
import ChatInfo from "./components/chat-info";
import MessageBar from "./components/message-bar";
import MessageContainer from "./components/message-container";
import { useChatStore } from "@/store/chatStore";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { apiClient } from "@/lib/api-client";

function ChatPageContainer() {
  const { selectedChatData, selectedChatType } = useChatStore();
  const { t } = useTranslation();

  // Usa questi stati per determinare quale banner mostrare
  const isRemovedFromGroup =
    selectedChatType === "group" &&
    selectedChatData &&
    selectedChatData.isActive === false &&
    selectedChatData.userRemoved === true;

  const hasLeftGroup =
    selectedChatType === "group" &&
    selectedChatData &&
    selectedChatData.isActive === false &&
    selectedChatData.userLeft === true;

  // Effetto per caricare i dettagli aggiornati del gruppo dopo che è stato selezionato
  useEffect(() => {
    if (
      selectedChatType === "group" &&
      selectedChatData &&
      selectedChatData._id
    ) {
      // Carica i dettagli aggiornati del gruppo
      apiClient
        .get(`/api/groups/get-group-details/${selectedChatData._id}`)
        .then((response) => {
          if (response.data && response.data.group) {
            // Aggiorna lo stato del gruppo con i flag più recenti
            useChatStore.getState().updateGroup(selectedChatData._id, {
              isActive: response.data.group.isActive,
              userRemoved: response.data.group.userRemoved,
              userLeft: response.data.group.userLeft,
            });
          }
        })
        .catch((error) =>
          console.error("Error fetching group details:", error)
        );
    }
  }, [selectedChatData?._id, selectedChatType]);

  return (
    <div className="fixed top-0 h-[100vh] w-[100vw] bg-[#1c1d25] flex flex-col md:static md:flex-1">
      <ChatInfo />

      {/* Banner per utente rimosso */}
      {isRemovedFromGroup && (
        <div className="bg-red-600 text-white py-2 px-4 text-center">
          {t("chat.removedFromGroup")}
        </div>
      )}

      {/* Banner per utente che ha lasciato il gruppo */}
      {hasLeftGroup && (
        <div className="bg-yellow-600 text-white py-2 px-4 text-center">
          {t("chat.leftGroup")}
        </div>
      )}

      <MessageContainer />
      <MessageBar />
    </div>
  );
}

export default ChatPageContainer;
