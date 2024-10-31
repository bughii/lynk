import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React, { useState, useRef } from "react";
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
import { CREATE_GROUP_ROUTE, HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";
import { useFriendStore } from "@/store/friendStore";
import { MdDelete } from "react-icons/md";
import { apiClient } from "@/lib/api-client";
import { useSocket } from "@/context/SocketContext";
import { useChatStore } from "@/store/chatStore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

function CreateGroup() {
  const [openFriendsDialog, setOpenFriendsDialog] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const searchInputRef = useRef(null);
  const { t } = useTranslation();

  const { searchedFriendsList, searchFriends, resetSearchedFriends } =
    useFriendStore();

  const { addGroup } = useChatStore();
  const socket = useSocket();

  const handleDialogChange = (open) => {
    setOpenFriendsDialog(open);
    if (!open) {
      setSelectedFriends([]);
      setGroupName("");
      setErrorMessage("");
      resetSearchedFriends();
      if (searchInputRef.current) {
        searchInputRef.current.value = "";
      }
    }
  };

  const addFriendToGroup = (friend) => {
    if (!selectedFriends.some((f) => f._id === friend._id)) {
      setSelectedFriends([...selectedFriends, friend]);
    }
    resetSearchedFriends();
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  const handleSearchFriends = async (e) => {
    const term = e.target.value;

    if (term === "") {
      resetSearchedFriends();
    } else {
      await searchFriends(term);
    }
  };

  const removeFriend = (friendId) => {
    setSelectedFriends(selectedFriends.filter((f) => f._id !== friendId));
  };

  const handleGroupCreation = async () => {
    if (!groupName || selectedFriends.length === 0) {
      toast.error(
        "Inserisci un nome per il gruppo e seleziona almeno un amico per creare il gruppo"
      );
      return;
    }

    try {
      const response = await apiClient.post(
        CREATE_GROUP_ROUTE,
        {
          name: groupName,
          members: selectedFriends.map((friend) => friend._id),
        },
        { withCredentials: true }
      );
      if (response.status === 201) {
        console.log("Group created:", response.data.group);
        handleDialogChange(false);
        addGroup(response.data.group);

        if (socket) {
          console.log("Emitting newGroup event", response.data.group);
          socket.emit("newGroup", response.data.group);
        } else {
          console.warn("Socket is not available");
        }
      }
    } catch (error) {
      console.error("Error creating group:", error.response?.data || error);
      toast.error(t("mainpage.groups.createGroupError"));
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <FaPlus
              className="text-neutral-400 font-light text-opacity-90 text-small hover:text-neutral-100 cursor-pointer transition-all duration-300"
              onClick={() => handleDialogChange(true)}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none mb-3 p-3 text-white">
            {t("mainpage.groups.createGroup")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={openFriendsDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="bg-[#181920] border-none text-white w-[400px] h-[500px] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("mainpage.groups.createGroup")}</DialogTitle>
          </DialogHeader>

          <div className="mb-4">
            <Input
              placeholder={t("mainpage.groups.groupNamePlaceholder")}
              className="rounded-lg p-6 bg-[#2c2e3b] border-none"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div>
            <Input
              placeholder={t("mainpage.groups.searchFriendPlaceholder")}
              ref={searchInputRef}
              className="rounded-lg p-6 bg-[#2c2e3b] border-none"
              onChange={handleSearchFriends}
            />
          </div>

          <ScrollArea className="h-[250px] mb-4">
            <div className="flex flex-col gap-5">
              {searchedFriendsList.map((friend) => (
                <div
                  key={friend._id}
                  className="flex gap-3 items-center cursor-pointer"
                  onClick={() => addFriendToGroup(friend)}
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

          <div className="flex flex-wrap gap-4 mt-4">
            <ScrollArea className="h-[100px] w-full overflow-y-auto">
              {selectedFriends.map((friend) => (
                <div
                  key={friend._id}
                  className="bg-[#1b1c24] text-white rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg transition-transform transform hover:scale-105"
                >
                  <span className="font-semibold">{friend.userName}</span>
                  <button
                    className="text-red-500 hover:text-red-600 transition-colors duration-200"
                    onClick={() => removeFriend(friend._id)}
                  >
                    <MdDelete className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </ScrollArea>
          </div>

          {errorMessage && (
            <div className="text-red-500 mt-2">{errorMessage}</div>
          )}

          <div className="mt-4">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
              onClick={handleGroupCreation}
            >
              {t("mainpage.groups.createGroupButton")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CreateGroup;
