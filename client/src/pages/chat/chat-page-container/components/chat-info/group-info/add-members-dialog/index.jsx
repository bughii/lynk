import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFriendStore } from "@/store/friendStore";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";
import { FaUserPlus, FaSearch, FaCheck, FaTimes } from "react-icons/fa";

function AddMembersDialog({
  open,
  onOpenChange,
  existingMembers = [],
  onMembersSelected,
}) {
  const { t } = useTranslation();
  const { friends, fetchFriends } = useFriendStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carica gli amici quando il dialogo viene aperto
  useEffect(() => {
    const loadFriends = async () => {
      setIsLoading(true);
      await fetchFriends();
      setIsLoading(false);
    };

    if (open) {
      loadFriends();
    } else {
      // Reset dello stato quando il dialogo si chiude
      setSelectedFriends([]);
      setSearchTerm("");
    }
  }, [open, fetchFriends]);

  // Filtra gli amici in base al termine di ricerca e esclude quelli già nel gruppo
  useEffect(() => {
    if (friends.length > 0) {
      const availableFriends = friends.filter(
        (friend) => !existingMembers.includes(friend._id)
      );

      if (searchTerm) {
        const filtered = availableFriends.filter((friend) =>
          friend.userName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredFriends(filtered);
      } else {
        setFilteredFriends(availableFriends);
      }
    }
  }, [friends, searchTerm, existingMembers]);

  const handleToggleFriend = (friend) => {
    setSelectedFriends((prev) => {
      const isSelected = prev.some((f) => f._id === friend._id);

      if (isSelected) {
        return prev.filter((f) => f._id !== friend._id);
      } else {
        return [...prev, friend];
      }
    });
  };

  const handleConfirm = () => {
    onMembersSelected(selectedFriends);
  };

  const removeFriend = (friendId, e) => {
    e.stopPropagation();
    setSelectedFriends(selectedFriends.filter((f) => f._id !== friendId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1b1c24] border-[#2f303b] text-white max-w-md w-full max-h-[85vh] flex flex-col">
        <DialogHeader className="px-4 py-4 border-b border-[#2f303b]">
          <DialogTitle className="text-lg font-medium">
            {t("groupInfo.addMembers")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <div className="relative mb-4">
            <Input
              placeholder={t("groupInfo.searchFriends")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-[#2f303b] border-none text-white focus:ring-0"
            />
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              size={12}
            />
          </div>

          {selectedFriends.length > 0 && (
            <div className="mb-4">
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                {t("groupInfo.selected")} ({selectedFriends.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedFriends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center gap-1 py-1 px-2 text-xs text-white border border-[#2f303b]"
                  >
                    <span>{friend.userName}</span>
                    <FaTimes
                      className="ml-1 cursor-pointer text-gray-400 hover:text-white"
                      onClick={(e) => removeFriend(friend._id, e)}
                      size={10}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredFriends.length > 0 && (
            <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">
              {t("groupInfo.availableFriends")} ({filteredFriends.length})
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 px-4">
          {isLoading ? (
            <div className="py-4 text-center text-sm text-gray-500">
              {t("common.loading")}...
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500">
              {t("groupInfo.noAvailableFriends")}
            </div>
          ) : (
            <div>
              {filteredFriends.map((friend) => {
                const isSelected = selectedFriends.some(
                  (f) => f._id === friend._id
                );

                return (
                  <div
                    key={friend._id}
                    className={`flex items-center justify-between py-2 px-2 cursor-pointer border-b border-[#2f303b] last:border-0 ${
                      isSelected ? "bg-[#2f303b]" : "hover:bg-[#2f303b]"
                    } transition-colors`}
                    onClick={() => handleToggleFriend(friend)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-7 w-7 mr-3">
                        {friend.image ? (
                          <AvatarImage
                            src={`${HOST}/${friend.image}`}
                            alt="profile"
                            className="object-cover"
                          />
                        ) : (
                          <AvatarImage
                            src={getAvatar(friend.avatar)}
                            alt="avatar"
                            className="object-cover"
                          />
                        )}
                      </Avatar>
                      <span className="text-sm">{friend.userName}</span>
                    </div>

                    {isSelected ? (
                      <button className="text-purple-500 p-1">
                        <FaCheck size={14} />
                      </button>
                    ) : (
                      <button className="text-gray-500 hover:text-purple-500 p-1">
                        <FaUserPlus size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 border-t border-[#2f303b]">
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1 bg-[#2f303b] hover:bg-[#3b3c48] text-white"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              disabled={selectedFriends.length === 0}
              onClick={handleConfirm}
              className="flex-1 bg-[#126319] hover:bg-[#1a8f24] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("groupInfo.addSelected")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddMembersDialog;
