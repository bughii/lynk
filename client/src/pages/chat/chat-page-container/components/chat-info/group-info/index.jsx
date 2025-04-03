import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useFriendStore } from "@/store/friendStore";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  FaUserMinus,
  FaUserPlus,
  FaCrown,
  FaUserFriends,
  FaImages,
  FaSignOutAlt,
  FaTrashAlt,
  FaInfoCircle,
  FaBan,
  FaComment,
} from "react-icons/fa";
import { getAvatar } from "@/lib/utils";
import { HOST } from "@/utils/constants";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import NewAdminDialog from "../new-admin-dialog";
import ConfirmDialog from "../confirm-dialog";
import { useSocket } from "@/context/SocketContext";
import AddMembersDialog from "./add-members-dialog";
import GroupMediaDialog from "./media-dialog";

function GroupInfoDialog({ open, onOpenChange, group }) {
  const socket = useSocket();

  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { friends, fetchFriends, sendRequest } = useFriendStore();
  const { closeChat, setSelectedChatType, setSelectedChatData } =
    useChatStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState([]);
  const [sortedMembers, setSortedMembers] = useState([]);
  const [showNewAdminDialog, setShowNewAdminDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [isUserRemoved, setIsUserRemoved] = useState(false);
  const [isUserLeft, setIsUserLeft] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [friendsMap, setFriendsMap] = useState({});

  // Function to load the complete group details
  const loadGroupDetails = async () => {
    if (!group || !group._id) return;

    setIsLoading(true);
    try {
      // Fetch group details with populated members
      const response = await apiClient.get(
        `/api/groups/get-group-details/${group._id}`
      );

      if (response.data && response.data.group) {
        const fullGroup = response.data.group;

        // Check if current user is the admin of the group
        const isUserAdmin = fullGroup.admin._id === user._id;
        setIsAdmin(isUserAdmin);

        // Prepare the members list
        let membersList = Array.isArray(fullGroup.members)
          ? [...fullGroup.members]
          : [];

        // Make sure the admin is included in the list
        if (
          fullGroup.admin &&
          !membersList.some((m) => m._id === fullGroup.admin._id)
        ) {
          membersList.push(fullGroup.admin);
        }

        // Set group state for the current user
        setIsUserRemoved(!!fullGroup.userRemoved);
        setIsUserLeft(!!fullGroup.userLeft);
        setIsActive(!!fullGroup.isActive);

        setMembers(membersList);
      }
    } catch (error) {
      console.error("Error loading group details:", error);
      toast.error(t("groupInfo.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Load friends data when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoadingFriends(true);
      fetchFriends()
        .then(() => {
          setIsLoadingFriends(false);
        })
        .catch((error) => {
          console.error("Error fetching friends:", error);
          setIsLoadingFriends(false);
        });
    }
  }, [open, fetchFriends]);

  // Create a map of friend IDs for faster lookup
  useEffect(() => {
    if (friends && Array.isArray(friends)) {
      const map = {};
      friends.forEach((friend) => {
        // Handle different friend object structures
        const friendId = friend._id || (friend.user && friend.user._id);
        if (friendId) {
          map[friendId] = true;
        }
      });
      setFriendsMap(map);
      console.log("Friends map updated:", map);
    }
  }, [friends]);

  useEffect(() => {
    if (open && group) {
      loadGroupDetails();
    }
  }, [group, open]);

  // Sort members - current user first, highlight admin
  useEffect(() => {
    if (members.length > 0) {
      // Create a copy of the members list we can reorder
      let orderedMembers = [...members];

      // First sort: put current user first
      orderedMembers.sort((a, b) => {
        if (a._id === user._id) return -1;
        if (b._id === user._id) return 1;
        return 0;
      });

      // Second sort: highlight admin
      // Don't move admin to top if different from current user
      // But add a property to identify them
      orderedMembers = orderedMembers.map((member) => ({
        ...member,
        isAdmin: member._id === group.admin?._id,
        isCurrentUser: member._id === user._id,
      }));

      setSortedMembers(orderedMembers);
    }
  }, [members, user, group]);

  // Robust function to check if a member is a friend
  const isFriend = (memberId) => {
    if (!memberId) return false;

    // Convert to string for consistent comparison
    const memberIdStr = String(memberId);

    // Check in the friendsMap for fast lookup
    if (friendsMap[memberIdStr]) {
      return true;
    }

    // Fallback to the slower check through the friends array
    if (!friends || !Array.isArray(friends) || friends.length === 0) {
      return false;
    }

    return friends.some((friend) => {
      // Handle different friend object structures
      const friendId = friend.user ? friend.user._id : friend._id;
      return String(friendId) === memberIdStr;
    });
  };

  const handleStartChat = (member) => {
    // Close the dialog
    onOpenChange(false);

    // Set private chat with selected member
    setSelectedChatType("friend");
    setSelectedChatData(member);
  };

  const [friendRequestMember, setFriendRequestMember] = useState(null);
  const [showFriendRequestDialog, setShowFriendRequestDialog] = useState(false);

  const handleFriendRequest = (member) => {
    setFriendRequestMember(member);
    setShowFriendRequestDialog(true);
  };

  const confirmFriendRequest = async () => {
    if (!friendRequestMember) return;

    try {
      const response = await sendRequest(friendRequestMember._id);
      if (response.status === 200) {
        toast.success(t("mainpage.friendsDialog.addFriend.requestSentSuccess"));
        setShowFriendRequestDialog(false);
      }
    } catch (error) {
      toast.error(t("mainpage.friendsDialog.addFriend.requestSentError"));
    }
  };

  const handleRemoveMember = (member) => {
    setSelectedMember(member);
    setConfirmAction("removeMember");
    setShowConfirmDialog(true);
  };

  const handleLeaveGroup = () => {
    // Don't allow user to leave if already removed or left the group
    if (isUserRemoved || isUserLeft || !isActive) {
      toast.error(t("chat.cannotSendMessageInactiveGroup"));
      return;
    }

    if (isAdmin) {
      // If user is admin, they must first select a new admin
      setShowNewAdminDialog(true);
    } else {
      // Otherwise, show confirmation dialog
      setConfirmAction("leaveGroup");
      setShowConfirmDialog(true);
    }
  };

  const handleDeleteGroup = () => {
    setConfirmAction("deleteGroup");
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    try {
      switch (confirmAction) {
        case "removeMember":
          if (selectedMember) {
            await apiClient.post("/api/groups/remove-member", {
              groupId: group._id,
              memberId: selectedMember._id,
            });

            // Update members list
            setMembers(members.filter((m) => m._id !== selectedMember._id));
            if (socket) {
              socket.emit("memberRemoved", {
                groupId: group._id,
                memberId: selectedMember._id,
                adminId: user._id,
              });
            }

            toast.success(t("groupInfo.memberRemoved"));
          }
          break;

        case "leaveGroup":
          await apiClient.post("/api/groups/leave-group", {
            groupId: group._id,
          });

          // Close chat and return to main view
          closeChat();
          onOpenChange(false);

          // Emit socket event to notify user has left
          if (socket) {
            socket.emit("leftGroup", {
              groupId: group._id,
              userId: user._id,
            });
          }

          // Update local state immediately
          const { updateGroup } = useChatStore.getState();
          updateGroup(group._id, {
            isActive: false,
            userRemoved: false,
            userLeft: true,
          });

          toast.success(t("groupInfo.leftGroup"));
          break;

        case "deleteGroup":
          try {
            const response = await apiClient.delete(
              `/api/groups/delete-group/${group._id}`
            );

            if (response.data && response.data.group) {
              // Update the group status locally
              const { updateGroup } = useChatStore.getState();
              updateGroup(group._id, {
                isDeleted: true,
                deletedAt: response.data.group.deletedAt,
              });

              // Emit socket event
              if (socket) {
                socket.emit("groupDeleted", {
                  groupId: group._id,
                  isRemoved: false, // Indicate we're not removing it
                });
              }

              // Add system message to chat
              const { addSystemMessage } = useChatStore.getState();
              addSystemMessage({
                groupId: group._id,
                content: t("notifications.groupDeletedByAdmin"),
                timestamp: new Date(),
              });

              // Close the dialog but keep the chat open
              onOpenChange(false);
              toast.success(t("groupInfo.deletedGroup"));
            }
          } catch (error) {
            console.error("Error deleting group:", error);
            toast.error(t("groupInfo.actionError"));
          }
          break;
      }
    } catch (error) {
      console.error("Action error:", error);
      toast.error(t("groupInfo.actionError"));
    }

    setShowConfirmDialog(false);
  };

  const handleNewAdminSelected = async (newAdminId) => {
    try {
      // API call to assign new admin
      await apiClient.post("/api/groups/change-admin", {
        groupId: group._id,
        newAdminId,
      });

      // Close admin selection dialog
      setShowNewAdminDialog(false);

      // Now we can leave the group
      await apiClient.post("/api/groups/leave-group", {
        groupId: group._id,
      });

      // Emit socket event to notify admin has left
      if (socket) {
        socket.emit("leftGroup", {
          groupId: group._id,
          userId: user._id,
          wasAdmin: true,
          newAdminId,
        });
      }

      // Close chat and return to main view
      closeChat();
      onOpenChange(false);
      toast.success(t("groupInfo.adminChangedAndLeft"));
    } catch (error) {
      console.error("Admin change error:", error);
      toast.error(t("groupInfo.adminChangeError"));
    }
  };

  const handleAddMembers = (selectedFriends) => {
    if (selectedFriends.length === 0) return;

    // API call to add members to group
    apiClient
      .post("/api/groups/add-members", {
        groupId: group._id,
        memberIds: selectedFriends.map((friend) => friend._id),
      })
      .then((response) => {
        // Update members list with new members
        const newMembers = selectedFriends.map((friend) => ({
          ...friend,
          isAdmin: false,
          isCurrentUser: false,
        }));

        // Update local members state
        setMembers((prevMembers) => [...prevMembers, ...newMembers]);

        // Emit socket event to notify new members
        if (socket) {
          socket.emit("membersAdded", {
            groupId: group._id,
            memberIds: selectedFriends.map((friend) => friend._id),
          });
        }

        toast.success(t("groupInfo.membersAdded"));
        setShowAddMembersDialog(false);
      })
      .catch((error) => {
        console.error("Error adding members:", error);
        toast.error(t("groupInfo.addMembersError"));
      });
  };

  // Render warning message if user is removed or left the group
  const renderGroupStatusWarning = () => {
    if (isUserRemoved) {
      return (
        <div className="px-4 py-3 mb-4 bg-red-500/20 text-red-400 rounded-lg flex items-center">
          <FaBan className="mr-2 flex-shrink-0" />
          <span>{t("chat.removedFromGroup")}</span>
        </div>
      );
    } else if (isUserLeft) {
      return (
        <div className="px-4 py-3 mb-4 bg-yellow-500/20 text-yellow-400 rounded-lg flex items-center">
          <FaSignOutAlt className="mr-2 flex-shrink-0" />
          <span>{t("chat.leftGroup")}</span>
        </div>
      );
    } else if (!isActive) {
      return (
        <div className="px-4 py-3 mb-4 bg-gray-500/20 text-gray-400 rounded-lg flex items-center">
          <FaInfoCircle className="mr-2 flex-shrink-0" />
          <span>{t("chat.cannotSendMessageInactiveGroup")}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#1b1c24] border-[#2f303b] text-white max-w-md w-full max-h-[85vh] flex flex-col space-mono-regular">
          <DialogHeader className="px-4 py-4 border-b border-[#2f303b] flex-shrink-0">
            <DialogTitle className="text-lg font-medium text-center">
              {group?.name || t("groupInfo.groupInformation")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 overflow-hidden p-4">
            {/* Group status warning for user */}
            {renderGroupStatusWarning()}

            {/* Media button - only if user can still interact with group */}
            {isActive && (
              <Button
                onClick={() => setShowMediaDialog(true)}
                className="mx-0 mb-4 bg-[#126319] hover:bg-[#1a8f24] text-white transition-all duration-300"
              >
                <FaImages className="mr-2" />
                {t("groupInfo.viewMedia")}
              </Button>
            )}

            {/* Members section */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {t("groupInfo.members")} ({sortedMembers.length})
              </div>

              {isAdmin && isActive && (
                <Button
                  onClick={() => setShowAddMembersDialog(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-[#126319] hover:text-[#1a8f24] hover:bg-[#2f303b] transition-all"
                >
                  <FaUserFriends className="mr-1" size={12} />
                  {t("groupInfo.addMembers")}
                </Button>
              )}
            </div>

            <ScrollArea className="flex-grow overflow-auto">
              {isLoading || isLoadingFriends ? (
                <div className="py-4 text-center text-sm text-gray-500">
                  {t("common.loading")}...
                </div>
              ) : (
                <div className="space-y-1">
                  {sortedMembers.map((member) => {
                    const isCurrentUser = member.isCurrentUser;
                    const memberIsFriend = isFriend(member._id);

                    return (
                      <div
                        key={member._id}
                        className="flex items-center py-2 px-3 hover:bg-[#2f303b] rounded-lg transition-colors cursor-pointer"
                      >
                        <div className="flex items-center flex-1">
                          <Avatar className="h-10 w-10 mr-3">
                            {member.image ? (
                              <AvatarImage
                                src={`${HOST}/${member.image}`}
                                alt="profile-image"
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <AvatarImage
                                src={getAvatar(member.avatar)}
                                alt="avatar"
                                className="object-cover w-full h-full"
                              />
                            )}
                          </Avatar>

                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <span className="text-sm font-medium">
                                {isCurrentUser
                                  ? t("groupInfo.you")
                                  : member.userName}
                              </span>

                              {member.isAdmin && (
                                <FaCrown
                                  className="ml-1.5 text-yellow-500"
                                  size={12}
                                />
                              )}
                            </div>

                            {isCurrentUser && member.isAdmin && (
                              <div className="text-xs text-gray-500">
                                {t("groupInfo.youAreAdmin")}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-1">
                          {/* Admin-only: Remove member button */}
                          {!isCurrentUser && isAdmin && isActive && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveMember(member);
                              }}
                              className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                              title={t("groupInfo.removeMember")}
                            >
                              <FaUserMinus size={15} />
                            </button>
                          )}

                          {/* For all non-current users */}
                          {!isCurrentUser && (
                            <>
                              {memberIsFriend ? (
                                // Icon for starting chat with friends
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartChat(member);
                                  }}
                                  className="p-2 bg-green-500/10 text-green-500 hover:text-green-400 hover:bg-green-500/20 rounded-full transition-all"
                                  title={t("common.startChat")}
                                >
                                  <FaComment size={15} />
                                </button>
                              ) : (
                                // Icon for adding non-friends
                                isActive && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFriendRequest(member);
                                    }}
                                    className="p-2 bg-blue-500/10 text-blue-500 hover:text-blue-400 hover:bg-blue-500/20 rounded-full transition-all"
                                    title={t("groupInfo.addFriend")}
                                  >
                                    <FaUserPlus size={15} />
                                  </button>
                                )
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="px-4 py-4 border-t border-[#2f303b] flex-shrink-0">
            {isActive && (
              <div className="flex flex-col sm:flex-row gap-2">
                {isAdmin ? (
                  <>
                    <Button
                      className="w-full sm:w-1/2 text-red-500 border border-red-500/30 bg-transparent hover:bg-red-500/10 transition-all"
                      onClick={handleLeaveGroup}
                    >
                      <FaSignOutAlt className="mr-2" size={14} />
                      {t("groupInfo.leaveGroup")}
                    </Button>
                    <Button
                      className="w-full sm:w-1/2 bg-red-500 hover:bg-red-600 text-white transition-all"
                      onClick={handleDeleteGroup}
                    >
                      <FaTrashAlt className="mr-2" size={14} />
                      {t("groupInfo.deleteGroup")}
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full text-red-500 border border-red-500/30 bg-transparent hover:bg-red-500/10 transition-all"
                    onClick={handleLeaveGroup}
                  >
                    <FaSignOutAlt className="mr-2" size={14} />
                    {t("groupInfo.leaveGroup")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog to select new admin */}
      {showNewAdminDialog && (
        <NewAdminDialog
          open={showNewAdminDialog}
          onOpenChange={setShowNewAdminDialog}
          members={members.filter((m) => m._id !== user._id)}
          onAdminSelected={handleNewAdminSelected}
        />
      )}

      {/* Confirmation dialog for actions */}
      {showConfirmDialog && (
        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          action={confirmAction}
          member={selectedMember}
          onConfirm={handleConfirmAction}
        />
      )}

      {/* Dialog to add new members */}
      {showAddMembersDialog && (
        <AddMembersDialog
          open={showAddMembersDialog}
          onOpenChange={setShowAddMembersDialog}
          existingMembers={members.map((m) => m._id)}
          onMembersSelected={handleAddMembers}
        />
      )}

      {/* Dialog to view group media */}
      {showMediaDialog && (
        <GroupMediaDialog
          open={showMediaDialog}
          onOpenChange={setShowMediaDialog}
          groupId={group._id}
        />
      )}

      {/* Dialog to confirm sending a friend request */}
      <Dialog
        open={showFriendRequestDialog}
        onOpenChange={setShowFriendRequestDialog}
      >
        <DialogContent className="bg-[#1b1c24] border-[#2f303b] text-white max-w-xs w-full">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-medium">
              {t("groupInfo.addFriend")}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-center text-gray-300 mb-4">
              {t("mainpage.friendsDialog.addFriend.confirmRequest")}
              <span className="font-bold ml-1">
                {friendRequestMember?.userName}
              </span>
              ?
            </p>

            <div className="flex justify-center space-x-3">
              <Button
                className="bg-[#2c2e3b] hover:bg-[#363848] transition-colors"
                onClick={() => setShowFriendRequestDialog(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="bg-[#126319] hover:bg-[#1a8f24] transition-colors"
                onClick={confirmFriendRequest}
              >
                {t("groupInfo.addFriend")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GroupInfoDialog;
