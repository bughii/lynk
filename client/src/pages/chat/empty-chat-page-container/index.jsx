import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import AddContact from "./add-contact";
import FriendRequests from "./received-requests";
import PendingRequests from "./sent-requests";
import FriendList from "./friend-list";

function EmptyChatContainer() {
  return (
    <div className="flex-1 md:bg-[#1c1d25] md:flex flex-col justify-start items-center hidden duration-1000 transition-all">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="text-opacity-80 text-white flex flex-col gap-5 items-center mt-10 lg:text-4xl text-3xl transition-all duration-3000">
          <h3 className="space-mono-regular">
            Ciao<span className="text-purple-500">!</span> Benvenuto su{" "}
            <span className="text-purple-500">Lynk</span>.
          </h3>
        </div>
      </div>
    </div>
  );
}

export default EmptyChatContainer;
