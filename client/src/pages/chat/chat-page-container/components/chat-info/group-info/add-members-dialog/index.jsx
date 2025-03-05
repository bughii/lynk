import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFriendStore } from "@/store/friendStore";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1b1c24] border-[#2c2e3b] text-white max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {t("groupInfo.addMembers")}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Input
            placeholder={t("groupInfo.searchFriends")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 bg-[#2c2e3b] border-none text-white"
          />

          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-300">
              {filteredFriends.length} {t("groupInfo.availableFriends")}
            </span>
            <span className="text-blue-400">
              {selectedFriends.length} {t("groupInfo.selected")}
            </span>
          </div>

          <ScrollArea className="h-60 pr-4">
            {isLoading ? (
              <div className="flex justify-center py-4 text-gray-400">
                {t("common.loading")}...
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="flex justify-center py-4 text-gray-400">
                {t("groupInfo.noAvailableFriends")}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFriends.map((friend) => {
                  const isSelected = selectedFriends.some(
                    (f) => f._id === friend._id
                  );

                  return (
                    <div
                      key={friend._id}
                      className={`flex items-center px-3 py-2 bg-[#2c2e3b] rounded-lg hover:bg-[#363848] transition-colors cursor-pointer ${
                        isSelected ? "ring-1 ring-blue-500" : ""
                      }`}
                      onClick={() => handleToggleFriend(friend)}
                    >
                      <div className="flex items-center flex-1">
                        <Checkbox
                          checked={isSelected}
                          className="mr-3 border-gray-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                          onCheckedChange={() => handleToggleFriend(friend)}
                        />

                        <Avatar className="h-10 w-10 rounded-full overflow-hidden mr-3">
                          {friend.image ? (
                            <AvatarImage
                              src={`${HOST}/${friend.image}`}
                              alt="profile"
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

                        <span className="text-white">{friend.userName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="flex justify-end mt-4">
          <Button
            variant="outline"
            className="mr-2"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            disabled={selectedFriends.length === 0}
            onClick={handleConfirm}
            className="bg-[#126319] hover:bg-[#1a8f24]"
          >
            {t("groupInfo.addSelected")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddMembersDialog;
