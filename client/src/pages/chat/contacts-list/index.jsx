import React, { useState } from "react";
import logo from "@/assets/logosite.svg";
import ProfileInfoComponent from "./components/profile-info";

import StartChat from "./components/start-chat";
import { useChatStore } from "@/store/chatStore";
import { useEffect } from "react";
import { useFriendStore } from "@/store/friendStore";
import ChatPreview from "@/components/chat-preview.jsx";
import { useSocket } from "@/context/SocketContext";
import CreateGroup from "./components/create-group";
import GroupPreview from "@/components/group-preview.jsx";
import { useTranslation } from "react-i18next";

function ContactsListContainer() {
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
    <div className="relative md:w-[40vw] lg:w-[30vw] xl:w-[20vw] bg-[#1b1c24] border-r-2 border-[#2f303b] w-full">
      <div className="pt-3 flex justify-center mb-10">
        <img src={logo} className="w-[100px] h-[100px]" />
      </div>

      <div className="my-5">
        <div className="flex items-center justify-between pr-10">
          <Title text={t("mainpage.privateMessages")} />
          <StartChat />
        </div>
        <div className="max-h-[30vh] overflow-y-auto scrollbar-hidden">
          <ChatPreview />
        </div>
      </div>
      <div className="my-5">
        <div className="flex items-center justify-between pr-10">
          <Title text={t("mainpage.groups.title")} />
          <CreateGroup />
        </div>
        <div className="max-h-[30vh] overflow-y-auto scrollbar-hidden">
          <GroupPreview groups={groups} isChannel={true} />
        </div>
      </div>

      <ProfileInfoComponent />
    </div>
  );
}

export default ContactsListContainer;

const Title = ({ text }) => {
  return (
    <h6 className="uppercase tracking-widest text-neutral-400 pl-5 font-light text-opacity-90 text-sm">
      {text}
    </h6>
  );
};
