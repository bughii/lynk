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
import {
  FaUserPlus,
  FaSearch,
  FaCheck,
  FaUserFriends,
  FaBan,
} from "react-icons/fa";
import { useChatStore } from "@/store/chatStore";

function AddMembersDialog({
  open,
  onOpenChange,
  existingMembers = [],
  onMembersSelected,
}) {
  const { t } = useTranslation();
  const { friends, fetchFriends } = useFriendStore();

  // Get blocked users from chat store
  const blockedUsers = useChatStore((state) => state.blockedUsers || []);
  const blockedByUsers = useChatStore((state) => state.blockedByUsers || []);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load friends when dialog opens
  useEffect(() => {
    const loadFriends = async () => {
      setIsLoading(true);
      await fetchFriends();
      setIsLoading(false);
    };

    if (open) {
      loadFriends();
    } else {
      // Reset state when dialog closes
      setSelectedFriends([]);
      setSearchTerm("");
    }
  }, [open, fetchFriends]);

  // Filter friends based on search term, existing members, and block status
  useEffect(() => {
    if (friends.length > 0) {
      // First, filter out existing members
      let availableFriends = friends.filter(
        (friend) => !existingMembers.includes(friend._id)
      );

      // Combine both directions of blocking
      const allBlockedIds = [...blockedUsers, ...blockedByUsers];

      // Then, filter out blocked users
      if (allBlockedIds.length > 0) {
        availableFriends = availableFriends.filter(
          (friend) => !allBlockedIds.includes(friend._id)
        );
      }

      // Finally, apply search term filter if present
      if (searchTerm) {
        const searchFiltered = availableFriends.filter((friend) =>
          friend.userName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredFriends(searchFiltered);
      } else {
        setFilteredFriends(availableFriends);
      }
    }
  }, [friends, searchTerm, existingMembers, blockedUsers, blockedByUsers]);

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

  // Check if any friends were filtered out due to blocks
  const availableFriendsCount = friends.filter(
    (friend) => !existingMembers.includes(friend._id)
  ).length;

  const hasBlockedUsers =
    filteredFriends.length < availableFriendsCount &&
    (blockedUsers.length > 0 || blockedByUsers.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1b1c24] border-[#2c2e3b] text-white max-w-md w-full max-h-[85vh] flex flex-col space-mono-regular">
        <DialogHeader className="flex-shrink-0 px-6 py-6 border-b border-[#2c2e3b]">
          <DialogTitle className="text-lg font-medium text-center flex items-center justify-center">
            <FaUserFriends className="mr-2 text-[#126319]" />
            {t("groupInfo.addMembers")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 flex-shrink-0">
          <div className="relative mb-4">
            <Input
              placeholder={t("groupInfo.searchFriends")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#2c2e3b] border-none text-white focus:ring-1 focus:ring-purple-500 h-12 rounded-xl"
            />
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
          </div>

          {/* Notification when some users are filtered out due to blocking */}
          {hasBlockedUsers && (
            <div className="bg-amber-900/20 text-amber-400 text-xs px-3 py-2 rounded-md mb-3 flex items-center">
              <FaBan className="mr-2 flex-shrink-0" size={12} />
              <span>{t("block.blockedUsersExcluded")}</span>
            </div>
          )}

          {filteredFriends.length > 0 && (
            <div className="text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center">
              <span>{t("groupInfo.availableFriends")}</span>
              <span className="ml-1 bg-[#2c2e3b] text-white text-xs rounded-full px-2 py-0.5 inline-flex items-center justify-center">
                {filteredFriends.length}
              </span>

              {selectedFriends.length > 0 && (
                <span className="ml-2 bg-[#126319] text-white text-xs rounded-full px-2 py-0.5 inline-flex items-center justify-center">
                  {selectedFriends.length} {t("groupInfo.selected")}
                </span>
              )}
            </div>
          )}
        </div>

        <ScrollArea className="flex-grow overflow-auto px-6 py-4">
          {isLoading ? (
            <div className="py-6 text-center text-sm text-gray-400">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-10 w-10 bg-gray-600 rounded-full mb-2"></div>
                <div className="h-3 w-24 bg-gray-600 rounded"></div>
              </div>
              <p className="mt-4">{t("common.loading")}...</p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="py-12 text-center">
              <FaUserFriends className="mx-auto text-gray-500 mb-4" size={40} />
              <p className="text-gray-400">
                {t("groupInfo.noAvailableFriends")}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFriends.map((friend) => {
                const isSelected = selectedFriends.some(
                  (f) => f._id === friend._id
                );

                return (
                  <div
                    key={friend._id}
                    className={`flex items-center justify-between py-3 px-3 cursor-pointer rounded-xl transition-all ${
                      isSelected ? "bg-[#126319]/20" : "hover:bg-[#2c2e3b]"
                    }`}
                    onClick={() => handleToggleFriend(friend)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        {friend.image ? (
                          <AvatarImage
                            src={`${HOST}/${friend.image}`}
                            alt="profile"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <AvatarImage
                            src={getAvatar(friend.avatar)}
                            alt="avatar"
                            className="object-cover w-full h-full"
                          />
                        )}
                      </Avatar>
                      <span className="text-sm font-medium">
                        {friend.userName}
                      </span>
                    </div>

                    {isSelected ? (
                      <div className="bg-[#126319] text-white p-2 rounded-full shadow-sm">
                        <FaCheck size={12} />
                      </div>
                    ) : (
                      <div className="text-gray-500 hover:text-[#126319] p-2 hover:bg-[#363848] rounded-full">
                        <FaUserPlus size={12} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-6 border-t border-[#2c2e3b] flex-shrink-0">
          <div className="flex gap-3 w-full">
            <Button
              className="flex-1 bg-[#2c2e3b] hover:bg-[#363848] text-white border-none rounded-xl py-5"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              disabled={selectedFriends.length === 0}
              onClick={handleConfirm}
              className="flex-1 bg-[#126319] hover:bg-[#1a8f24] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-5"
            >
              {t("groupInfo.addSelected")}
              {selectedFriends.length > 0 && (
                <span className="ml-2 bg-white text-[#126319] text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                  {selectedFriends.length}
                </span>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddMembersDialog;
