import React, { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaPlus, FaSearch, FaUserFriends } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";
import { useFriendStore } from "@/store/friendStore";
import { useChatStore } from "@/store/chatStore";
import { useTranslation } from "react-i18next";

function StartChat() {
  const [openFriendsDialog, setOpenFriendsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const {
    friends,
    fetchFriends,
    searchedFriendsList,
    searchFriends,
    resetSearchedFriends,
  } = useFriendStore();

  const { setSelectedChatType, setSelectedChatData } = useChatStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (openFriendsDialog) {
      setIsLoading(true);
      fetchFriends().then(() => {
        setIsLoading(false);
      });
    } else {
      resetSearchedFriends();
      setSearchTerm("");
    }
  }, [openFriendsDialog, fetchFriends, resetSearchedFriends]);

  const displayedFriends = searchTerm ? searchedFriendsList : friends;

  const selectNewChat = (friend) => {
    setOpenFriendsDialog(false);
    setSelectedChatType("friend");
    setSelectedChatData(friend);
    resetSearchedFriends();
  };

  const handleSearchFriends = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term === "") {
      resetSearchedFriends();
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
            {t("mainpage.startChat")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={openFriendsDialog} onOpenChange={setOpenFriendsDialog}>
        <DialogContent className="bg-[#1b1c24] border-none text-white w-[400px] max-h-[80vh] flex flex-col space-mono-regular">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-medium">
              {t("mainpage.startChat")}
            </DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder={t("mainpage.placeholderStartChat")}
              value={searchTerm}
              onChange={handleSearchFriends}
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#2c2e3b] border-none text-white focus:ring-1 focus:ring-[#126319]"
            />
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              size={16}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#126319]"></div>
            </div>
          ) : displayedFriends.length === 0 ? (
            <div className="p-6 text-center text-gray-400 flex flex-col items-center">
              <FaUserFriends className="text-gray-500 mb-3" size={32} />
              <p>
                {searchTerm
                  ? t("mainpage.noSearchResults")
                  : t("mainpage.noFriendsAvailable")}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[250px] pr-2">
              <div className="space-y-1 pr-2">
                {displayedFriends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center p-3 rounded-lg hover:bg-[#2c2e3b] cursor-pointer transition-all"
                    onClick={() => selectNewChat(friend)}
                  >
                    <Avatar className="h-12 w-12 mr-4">
                      {friend.image ? (
                        <AvatarImage
                          src={`${HOST}/${friend.image}`}
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
                    <div>
                      <div className="font-medium">{friend.userName}</div>
                      {friend.isOnline && (
                        <div className="text-xs text-green-500">
                          {t("mainpage.online")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default StartChat;
