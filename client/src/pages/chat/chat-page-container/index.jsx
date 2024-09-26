import React from "react";
import ChatInfo from "./components/chat-info";
import MessageBar from "./components/message-bar";
import MessageContainer from "./components/message-container";

function ChatPageContainer() {
  return (
    <div className="fixed top-0 h-[100vh] w-[100vw] bg-[#1c1d25] flex flex-col md:static md:flex-1">
      <ChatInfo />
      <MessageContainer />
      <MessageBar />
    </div>
  );
}

export default ChatPageContainer;
