import React, { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FaPlus,
  FaSearch,
  FaUserFriends,
  FaArrowRight,
  FaCheck,
  FaUsers,
  FaUserPlus,
  FaBan,
} from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { CREATE_GROUP_ROUTE, HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";
import { useFriendStore } from "@/store/friendStore";
import { apiClient } from "@/lib/api-client";
import { useSocket } from "@/context/SocketContext";
import { useChatStore } from "@/store/chatStore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

function CreateGroup() {
  // States for managing dialogs
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [showMembersStep, setShowMembersStep] = useState(false);

  // States for group data
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    friends,
    fetchFriends,
    searchedFriendsList,
    searchFriends,
    resetSearchedFriends,
  } = useFriendStore();

  // Get the blocked users information from the chat store
  const blockedUsers = useChatStore((state) => state.blockedUsers || []);
  const blockedByUsers = useChatStore((state) => state.blockedByUsers || []);
  const addGroup = useChatStore((state) => state.addGroup);

  const { t } = useTranslation();
  const socket = useSocket();

  // Load friends when the dialog opens for member selection
  useEffect(() => {
    if (showMembersStep) {
      setIsLoading(true);
      fetchFriends().then(() => {
        setIsLoading(false);
      });
    }
  }, [showMembersStep, fetchFriends]);

  // Reset everything when dialog closes
  const handleDialogClose = () => {
    setOpenCreateDialog(false);
    resetForm();
  };

  // Reset form state
  const resetForm = () => {
    setGroupName("");
    setSelectedFriends([]);
    setSearchTerm("");
    setShowMembersStep(false);
    resetSearchedFriends();
  };

  // Move to next step if group name is valid
  const handleNextStep = () => {
    if (!groupName.trim()) {
      toast.error(t("mainpage.groups.groupNameRequired"));
      return;
    }
    setShowMembersStep(true);
  };

  // Return to first step
  const handleBackToNameStep = () => {
    setShowMembersStep(false);
  };

  // Handle friend search
  const handleSearchFriends = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term === "") {
      resetSearchedFriends();
    } else {
      await searchFriends(term);
    }
  };

  // Filter out blocked users from the friends list
  const getFilteredFriends = () => {
    // Start with either search results or all friends
    const displayedFriends = searchTerm ? searchedFriendsList : friends;

    // If no displayed friends, return empty array
    if (!displayedFriends || !Array.isArray(displayedFriends)) return [];

    // Combine both directions of blocking
    const allBlockedIds = [...blockedUsers, ...blockedByUsers];

    // No blocked users, return the original list
    if (allBlockedIds.length === 0) return displayedFriends;

    // Filter out any users that are in the blocked lists
    return displayedFriends.filter((user) => !allBlockedIds.includes(user._id));
  };

  // Toggle friend selection
  const toggleFriendSelection = (friend) => {
    setSelectedFriends((prev) => {
      const isSelected = prev.some((f) => f._id === friend._id);

      if (isSelected) {
        return prev.filter((f) => f._id !== friend._id);
      } else {
        return [...prev, friend];
      }
    });
  };

  // Create the group
  const handleCreateGroup = async () => {
    if (!groupName || selectedFriends.length === 0) {
      toast.error(t("mainpage.groups.createGroupValidationError"));
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
        handleDialogClose();
        addGroup(response.data.group);

        if (socket) {
          socket.emit("newGroup", response.data.group);
        }

        toast.success(t("mainpage.groups.createGroupSuccess"));
      }
    } catch (error) {
      if (error.response?.data?.blockedUsernames) {
        // Show specific error for blocked users
        toast.error(
          `${t("block.cannotAddBlocked")}: ${
            error.response.data.blockedUsernames
          }`
        );
      } else {
        toast.error(t("mainpage.groups.createGroupError"));
      }
      console.error("Error creating group:", error.response?.data || error);
    }
  };

  // Get the filtered friends and check if any were filtered due to blocks
  const filteredFriends = getFilteredFriends();
  const totalFriends = searchTerm ? searchedFriendsList.length : friends.length;
  const hasBlockedUsers = filteredFriends.length < totalFriends;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <FaPlus
              className="text-neutral-400 font-light text-opacity-90 text-small hover:text-neutral-100 cursor-pointer transition-all duration-300"
              onClick={() => setOpenCreateDialog(true)}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none mb-3 p-3 text-white">
            {t("mainpage.groups.createGroup")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={openCreateDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="bg-[#1b1c24] border-none text-white w-[90vw] max-w-[450px] max-h-[85vh] flex flex-col space-mono-regular">
          {!showMembersStep ? (
            // STEP 1: Group name
            <>
              <DialogHeader className="py-4 border-b border-[#2f303b]">
                <DialogTitle className="text-center text-lg font-medium flex items-center justify-center">
                  <FaUsers className="mr-2 text-[#126319]" />
                  {t("mainpage.groups.createGroup")}
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col p-6">
                <p className="text-gray-400 mb-6 text-center">
                  {t("mainpage.groups.createGroupDescription")}
                </p>

                <Input
                  placeholder={t("mainpage.groups.groupNamePlaceholder")}
                  className="rounded-lg p-6 bg-[#2c2e3b] border-none text-white focus:ring-2 focus:ring-[#126319] mb-8"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  autoFocus
                />

                <Button
                  onClick={handleNextStep}
                  className="bg-[#126319] hover:bg-[#1a8f24] text-white rounded-lg py-6 transition-all flex items-center justify-center"
                  disabled={!groupName.trim()}
                >
                  {t("mainpage.groups.nextStepButton")}
                  <FaArrowRight className="ml-2" />
                </Button>
              </div>
            </>
          ) : (
            // STEP 2: Member selection
            <>
              <DialogHeader className="py-4 border-b border-[#2f303b]">
                <DialogTitle className="text-center text-lg font-medium flex items-center justify-center">
                  <FaUserFriends className="mr-2 text-[#126319]" />
                  {t("mainpage.groups.addMembersTitle")}
                </DialogTitle>
              </DialogHeader>

              <div className="p-4 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-400">
                    {groupName}
                  </h3>
                  <span className="text-xs text-[#126319] bg-[#126319]/10 px-2 py-1 rounded-full">
                    {selectedFriends.length}{" "}
                    {t("mainpage.groups.membersSelected")}
                  </span>
                </div>

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

                {/* Show notification when some users are filtered out due to blocking */}
                {hasBlockedUsers && (
                  <div className="bg-amber-900/20 text-amber-400 text-xs px-3 py-2 rounded-md mb-3 flex items-center">
                    <FaBan className="mr-2 flex-shrink-0" size={12} />
                    <span>{t("block.blockedUsersExcluded")}</span>
                  </div>
                )}
              </div>

              <ScrollArea className="flex-grow px-4 pb-4 h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#126319]"></div>
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 flex flex-col items-center">
                    <FaUserFriends className="text-gray-500 mb-3" size={32} />
                    <p>
                      {searchTerm
                        ? t("mainpage.noSearchResults")
                        : t("mainpage.noFriendsAvailable")}
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
                          className={`flex items-center p-3 rounded-lg hover:bg-[#2c2e3b] cursor-pointer transition-all ${
                            isSelected ? "bg-[#2c2e3b]" : ""
                          }`}
                          onClick={() => toggleFriendSelection(friend)}
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

                          <div className="ml-auto">
                            {isSelected ? (
                              <div className="w-8 h-8 bg-[#126319] rounded-full flex items-center justify-center">
                                <FaCheck className="text-white" size={12} />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-[#363848] rounded-full flex items-center justify-center">
                                <FaUserPlus
                                  className="text-gray-400"
                                  size={12}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              <DialogFooter className="p-4 border-t border-[#2f303b]">
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button
                    onClick={handleBackToNameStep}
                    className="bg-[#2c2e3b] hover:bg-[#363848] text-white"
                  >
                    {t("common.back")}
                  </Button>
                  <Button
                    onClick={handleCreateGroup}
                    className="bg-[#126319] hover:bg-[#1a8f24] text-white"
                    disabled={selectedFriends.length === 0}
                  >
                    {t("mainpage.groups.createGroupButton")}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CreateGroup;
