import React, { useState, useEffect } from "react";
import logo from "@/assets/logosite.svg";
import ProfileInfoComponent from "./components/profile-info";
import StartChat from "./components/start-chat";
import CreateGroup from "./components/create-group";
import { useChatStore } from "@/store/chatStore";
import { useFriendStore } from "@/store/friendStore";
import ChatPreview from "@/components/chat-preview.jsx";
import GroupPreview from "@/components/group-preview.jsx";
import { useSocket } from "@/context/SocketContext";
import { useTranslation } from "react-i18next";

function ContactsListContainer() {
  //'chats' or 'groups'
  const [activeTab, setActiveTab] = useState("chats");

  const { setDirectMessagesFriends, groups, fetchUserGroups } = useChatStore();
  const { t } = useTranslation();
  const { getChatPreview } = useFriendStore();
  const socket = useSocket();

  useEffect(() => {
    const getFriends = async () => {
      const response = await getChatPreview();
      if (response.data.friends) {
        setDirectMessagesFriends(response.data.friends);
      }
    };

    getFriends();
    fetchUserGroups();

    if (socket) {
      console.log("Socket connected:", socket.id);

      socket.on("connect", () => {
        console.log("Socket reconnected:", socket.id);
      });

      socket.on("receiveMessage", handleNewMessage);
    }

    function handleNewMessage(message) {
      console.log("Received new message:", message);
      getFriends();
    }

    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("receiveMessage", handleNewMessage);
      }
    };
  }, [socket, setDirectMessagesFriends, getChatPreview, fetchUserGroups]);

  return (
    <div className="relative md:w-[40vw] lg:w-[30vw] xl:w-[20vw] bg-[#1b1c24] border-r-2 border-[#2f303b] w-full flex flex-col h-full">
      {/* Logo */}
      <div className="pt-3 flex justify-center mb-5">
        <img src={logo} className="w-[100px] h-[100px]" alt="Logo" />
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mb-4">
        <div className="flex border-b border-[#2f303b]">
          <button
            onClick={() => setActiveTab("chats")}
            className={`w-1/2 py-3 text-sm transition-all duration-200 ${
              activeTab === "chats"
                ? "border-b-2 border-[#126319] text-white"
                : "text-gray-500 hover:text-gray-400 border-b-2 border-transparent"
            }`}
          >
            {t("mainpage.privateMessages")}
          </button>

          <button
            onClick={() => setActiveTab("groups")}
            className={`w-1/2 py-3 text-sm transition-all duration-200 ${
              activeTab === "groups"
                ? "border-b-2 border-[#126319] text-white"
                : "text-gray-500 hover:text-gray-400 border-b-2 border-transparent"
            }`}
          >
            {t("mainpage.groups.title")}
          </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-4 mb-3 flex justify-end items-center">
        {activeTab === "chats" ? <StartChat /> : <CreateGroup />}
      </div>

      {/* Conditionally render based on active tab */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chats" ? (
          <div className="h-full">
            <ChatPreview />
          </div>
        ) : (
          <div className="h-full">
            <GroupPreview groups={groups} isChannel={true} />
          </div>
        )}
      </div>

      {/* Profile Info at bottom */}
      <ProfileInfoComponent />
    </div>
  );
}

export default ContactsListContainer;
