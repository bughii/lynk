import React, { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-[100vh] text-white overflow-hidden">Chat page</div>
  );
};

export default Chat;
