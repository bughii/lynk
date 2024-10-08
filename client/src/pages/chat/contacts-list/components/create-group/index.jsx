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
import { CREATE_GROUP_ROUTE, HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";
import { useFriendStore } from "@/store/friendStore";
import { MdDelete } from "react-icons/md";
import { apiClient } from "@/lib/api-client";
import { useChatStore } from "@/store/chatStore";

function CreateGroup() {
  const [openFriendsDialog, setOpenFriendsDialog] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [groupName, setGroupName] = useState(""); // Stato per il nome del gruppo
  const [errorMessage, setErrorMessage] = useState("");

  const { searchedFriendsList, searchFriends, resetSearchedFriends } =
    useFriendStore();

  const { addGroup } = useChatStore();

  const addFriendToGroup = (friend) => {
    if (!selectedFriends.some((f) => f._id === friend._id)) {
      setSelectedFriends([...selectedFriends, friend]);
    }
    resetSearchedFriends();
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
      setErrorMessage(
        "Inserisci un nome per il gruppo e seleziona almeno un amico."
      );
      return;
    }

    try {
      const response = await apiClient.post(
        CREATE_GROUP_ROUTE,
        {
          name: groupName,
          members: selectedFriends.map((friend) => friend._id), // Inviamo solo gli ID degli amici
        },
        { withCredentials: true }
      );
      if (response.status === 201) {
        console.log("Group created:", response.data.group);
        setOpenFriendsDialog(false); // Chiudiamo il dialogo dopo la creazione del gruppo
        addGroup(response.data.group);
      }
    } catch (error) {
      console.error("Error creating group:", error.response?.data || error);
      setErrorMessage("Si è verificato un errore nella creazione del gruppo.");
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
            Crea un gruppo
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={openFriendsDialog} onOpenChange={setOpenFriendsDialog}>
        <DialogContent className="bg-[#181920] border-none text-white w-[400px] h-[500px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Crea un gruppo</DialogTitle>
          </DialogHeader>

          {/* Input per il nome del gruppo */}
          <div className="mb-4">
            <Input
              placeholder="Nome del gruppo"
              className="rounded-lg p-6 bg-[#2c2e3b] border-none"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Input per cercare amici */}
          <div>
            <Input
              placeholder="Cerca amico"
              className="rounded-lg p-6 bg-[#2c2e3b] border-none"
              onChange={handleSearchFriends}
            />
          </div>

          {/* Area di scroll per visualizzare i risultati della ricerca degli amici */}
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

          {/* Sezione per visualizzare gli amici selezionati */}
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

          {/* Messaggio di errore */}
          {errorMessage && (
            <div className="text-red-500 mt-2">{errorMessage}</div>
          )}

          {/* Pulsante per confermare la creazione del gruppo */}
          <div className="mt-4">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
              onClick={handleGroupCreation}
            >
              Crea Gruppo
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CreateGroup;
