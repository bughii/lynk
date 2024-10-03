import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";
import { useFriendStore } from "@/store/friendStore";
import { useChatStore } from "@/store/chatStore";

function StartChat() {
  const [openFriendsDialog, setOpenFriendsDialog] = useState(false);

  const { searchedFriendsList, searchFriends, resetSearchedFriends } =
    useFriendStore();

  const { setSelectedChatType, setSelectedChatData } = useChatStore();

  const selectNewChat = (friend) => {
    setOpenFriendsDialog(false);
    setSelectedChatType("friend");
    setSelectedChatData(friend);
    resetSearchedFriends();
  };

  const handleSearchFriends = async (e) => {
    const term = e.target.value;

    if (term === "") {
      resetSearchedFriends(); // Reset the searched friends list if the search term is empty
    } else {
      await searchFriends(term);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <FaPlus
              className="text-neutral-400 font-light text-opacity-90 text-small hover:text-neutral-100 cursor-pointer transition-all duration-300"
              onClick={() => setOpenFriendsDialog(true)}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none mb-3 p-3 text-white">
            Seleziona un amico
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={openFriendsDialog} onOpenChange={setOpenFriendsDialog}>
        <DialogContent className="bg-[#181920] border-none text-white w-[400px] h-[400px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleziona un amico</DialogTitle>
          </DialogHeader>
          <div>
            <Input
              placeholder="Cerca amico"
              className="rounded-lg p-6 bg-[#2c2e3b] border-none"
              onChange={handleSearchFriends}
            />
          </div>
          <ScrollArea className="h-[250px]">
            <div className="flex flex-col gap-5">
              {searchedFriendsList.map((friend) => (
                <div
                  key={friend._id}
                  className="flex gap-3 items-center cursor-pointer"
                  onClick={() => selectNewChat(friend)}
                >
                  <div>
                    <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                      {friend.image ? (
                        <AvatarImage
                          src={`${HOST}/${friend.image} `}
                          alt="profile-image"
                          className="object-cover w-full h-full bg-black"
                        />
                      ) : (
                        <AvatarImage
                          src={getAvatar(friend.avatar)}
                          alt="avatar"
                          className="object-cover w-full h-full"
                        />
                      )}
                    </Avatar>
                  </div>
                  <div className="space-mono-regular">{friend.userName}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default StartChat;
