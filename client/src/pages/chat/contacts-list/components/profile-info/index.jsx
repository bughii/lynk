import React from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { FiEdit2 } from "react-icons/fi";
import { IoPowerSharp } from "react-icons/io5";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function ProfileInfoComponent() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    logout();
  };

  return (
    <div className="absolute bottom-4 h-20 flex items-center justify-between px-5 w-full bg-[#1b1c24]">
      <div className="flex gap-3 items-center justify-center">
        <div>
          <Avatar className="h-12 w-12 rounded-full overflow-hidden">
            {user.image ? (
              <AvatarImage
                src={`${HOST}/${user.image}`}
                alt="profile-image"
                className="object-cover w-full h-full bg-black"
              />
            ) : (
              <AvatarImage
                src={getAvatar(user.avatar)}
                alt="avatar"
                className="object-cover w-full h-full"
              />
            )}
          </Avatar>
        </div>
        <div className="space-mono-regular">
          {user.userName ? `${user.userName}` : ""}
        </div>
      </div>
      <div className="flex gap-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <FiEdit2
                className="text-purple-500 text-xl font-medium"
                onClick={() => navigate("/profile")}
              />
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1b1e] border-none text-white">
              <p>Modifica profilo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <IoPowerSharp
                className="text-red-500 text-xl font-medium"
                onClick={handleLogout}
              />
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1b1e] border-none text-white">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export default ProfileInfoComponent;
