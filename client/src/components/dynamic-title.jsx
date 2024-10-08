import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";

export const usePageTitle = () => {
  const getTotalUnreadCount = useChatStore(
    (state) => state.getTotalUnreadCount
  );

  useEffect(() => {
    const updateTitle = () => {
      const totalUnread = getTotalUnreadCount();
      document.title = totalUnread > 0 ? `Lynk (${totalUnread})` : "Lynk";
    };

    // Aggiorna il titolo inizialmente
    updateTitle();

    // Crea un intervallo per aggiornare il titolo periodicamente
    const intervalId = setInterval(updateTitle, 1000);

    // Pulisci l'intervallo quando il componente viene smontato
    return () => clearInterval(intervalId);
  }, [getTotalUnreadCount]);
};
