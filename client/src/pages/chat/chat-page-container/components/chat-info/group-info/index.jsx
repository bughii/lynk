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
import { Separator } from "@/components/ui/separator";
import NewAdminDialog from "../new-admin-dialog";
import ConfirmDialog from "../confirm-dialog";
import { useSocket } from "@/context/SocketContext";
import AddMembersDialog from "./add-members-dialog";
import GroupMediaDialog from "./media-dialog";

function GroupInfoDialog({ open, onOpenChange, group }) {
  const socket = useSocket();

  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { friends, sendRequest } = useFriendStore();
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
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);

  // Funzione per caricare i dettagli completi del gruppo
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

        // Verificare se l'utente corrente è l'admin del gruppo
        const isUserAdmin = fullGroup.admin._id === user._id;
        setIsAdmin(isUserAdmin);

        // Preparare la lista dei membri
        let membersList = Array.isArray(fullGroup.members)
          ? [...fullGroup.members]
          : [];

        // Assicurarsi che l'admin sia incluso nella lista
        if (
          fullGroup.admin &&
          !membersList.some((m) => m._id === fullGroup.admin._id)
        ) {
          membersList.push(fullGroup.admin);
        }

        setMembers(membersList);
      }
    } catch (error) {
      console.error("Error loading group details:", error);
      toast.error(t("groupInfo.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && group) {
      loadGroupDetails();
    }
  }, [group, open]);

  // Effetto per ordinare i membri in modo che l'utente corrente sia primo e l'admin sia evidenziato
  useEffect(() => {
    if (members.length > 0) {
      // Crea una copia della lista membri che possiamo riordinare
      let orderedMembers = [...members];

      // Prima ordinamento: metti l'utente corrente all'inizio
      orderedMembers.sort((a, b) => {
        if (a._id === user._id) return -1;
        if (b._id === user._id) return 1;
        return 0;
      });

      // Secondo ordinamento: evidenzia amministratore
      // Non spostiamo l'admin in cima se è diverso dall'utente corrente
      // Ma aggiungiamo una proprietà per identificarlo
      orderedMembers = orderedMembers.map((member) => ({
        ...member,
        isAdmin: member._id === group.admin?._id,
        isCurrentUser: member._id === user._id,
      }));

      setSortedMembers(orderedMembers);
    }
  }, [members, user, group]);

  const isFriend = (memberId) => {
    return friends.some((friend) => friend._id === memberId);
  };

  const handleSendFriendRequest = async (memberId) => {
    try {
      const response = await sendRequest(memberId);
      if (response.status === 200) {
        toast.success(t("mainpage.friendsDialog.addFriend.requestSentSuccess"));
      }
    } catch (error) {
      toast.error(t("mainpage.friendsDialog.addFriend.requestSentError"));
    }
  };

  const handleStartChat = (member) => {
    // Chiudere il dialog
    onOpenChange(false);

    // Impostare la chat privata con il membro selezionato
    setSelectedChatType("friend");
    setSelectedChatData(member);
  };

  const handleMemberClick = (member) => {
    if (member.isCurrentUser) return; // Non fare nulla se è l'utente corrente

    if (isFriend(member._id)) {
      // Se sono amici, avvia la chat privata
      handleStartChat(member);
    } else {
      // Se non sono amici, invia una richiesta di amicizia
      handleSendFriendRequest(member._id);
      toast.info(t("groupInfo.friendRequestSent"));
    }
  };

  const handleRemoveMember = (member) => {
    setSelectedMember(member);
    setConfirmAction("removeMember");
    setShowConfirmDialog(true);
  };

  const handleLeaveGroup = () => {
    if (isAdmin) {
      // Se l'utente è admin, deve prima selezionare un nuovo admin
      setShowNewAdminDialog(true);
    } else {
      // Altrimenti, mostra la finestra di conferma
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

            // Aggiornare la lista membri
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

          // Chiudere la chat e tornare alla vista principale
          closeChat();
          onOpenChange(false);

          // Emettere un evento socket per notificare che l'utente è uscito
          if (socket) {
            socket.emit("leftGroup", {
              groupId: group._id,
              userId: user._id,
            });
          }

          // Aggiorna immediatamente lo stato locale
          const { updateGroup } = useChatStore.getState();
          updateGroup(group._id, {
            isActive: false,
            userRemoved: false,
            userLeft: true,
          });

          toast.success(t("groupInfo.leftGroup"));
          break;

        case "deleteGroup":
          await apiClient.delete(`/api/groups/delete-group/${group._id}`);

          // Chiudere la chat e tornare alla vista principale
          closeChat();
          onOpenChange(false);
          toast.success(t("groupInfo.deletedGroup"));
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
      // Chiamata API per assegnare il nuovo admin
      await apiClient.post("/api/groups/change-admin", {
        groupId: group._id,
        newAdminId,
      });

      // Chiudere il dialog di selezione admin
      setShowNewAdminDialog(false);

      // Ora possiamo uscire dal gruppo
      await apiClient.post("/api/groups/leave-group", {
        groupId: group._id,
      });

      // Emettere un evento socket per notificare che l'admin è uscito
      if (socket) {
        socket.emit("leftGroup", {
          groupId: group._id,
          userId: user._id,
          wasAdmin: true,
          newAdminId,
        });
      }

      // Chiudere la chat e tornare alla vista principale
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

    // Chiamata API per aggiungere membri al gruppo
    apiClient
      .post("/api/groups/add-members", {
        groupId: group._id,
        memberIds: selectedFriends.map((friend) => friend._id),
      })
      .then((response) => {
        // Aggiorna la lista dei membri includendo i nuovi membri
        const newMembers = selectedFriends.map((friend) => ({
          ...friend,
          isAdmin: false,
          isCurrentUser: false,
        }));

        // Aggiorna lo stato locale dei membri
        setMembers((prevMembers) => [...prevMembers, ...newMembers]);

        // Emetti evento socket per notificare i nuovi membri
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#1b1c24] border-[#2f303b] text-white max-w-md w-full max-h-[85vh] flex flex-col">
          <DialogHeader className="px-4 py-4 border-b border-[#2f303b]">
            <DialogTitle className="text-lg font-medium">
              {group?.name || t("groupInfo.groupInformation")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Media button */}
            <Button
              onClick={() => setShowMediaDialog(true)}
              className="mx-4 mt-4 mb-2 bg-[#126319] hover:bg-[#1a8f24] text-white"
            >
              <FaImages className="mr-2" />
              {t("groupInfo.viewMedia")}
            </Button>

            {/* Members section */}
            <div className="px-4 mt-4 flex items-center justify-between">
              <div className="text-sm font-medium uppercase tracking-wider text-gray-400">
                {t("groupInfo.members")} ({sortedMembers.length})
              </div>

              {isAdmin && (
                <Button
                  onClick={() => setShowAddMembersDialog(true)}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-purple-500 hover:text-purple-400 hover:bg-[#2f303b]"
                >
                  <FaUserFriends className="mr-1" size={12} />
                  {t("groupInfo.addMembers")}
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 px-4 py-2">
              {isLoading ? (
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
                        className="flex items-center py-2 px-2 hover:bg-[#2f303b] transition-colors cursor-pointer"
                      >
                        <div
                          className="flex items-center flex-1"
                          onClick={() => handleMemberClick(member)}
                        >
                          <Avatar className="h-8 w-8 mr-3">
                            {member.image ? (
                              <AvatarImage
                                src={`${HOST}/${member.image}`}
                                alt="profile-image"
                                className="object-cover"
                              />
                            ) : (
                              <AvatarImage
                                src={getAvatar(member.avatar)}
                                alt="avatar"
                                className="object-cover"
                              />
                            )}
                          </Avatar>

                          <div>
                            <div className="flex items-center">
                              <span className="text-sm">
                                {isCurrentUser
                                  ? t("groupInfo.you")
                                  : member.userName}
                              </span>

                              {member.isAdmin && (
                                <FaCrown
                                  className="ml-1.5 text-yellow-500"
                                  size={10}
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

                        <div className="flex">
                          {!isCurrentUser && isAdmin && (
                            <button
                              onClick={() => handleRemoveMember(member)}
                              className="p-1.5 text-red-500 hover:text-red-400"
                              title={t("groupInfo.removeMember")}
                            >
                              <FaUserMinus size={14} />
                            </button>
                          )}

                          {!isCurrentUser && !memberIsFriend && (
                            <button
                              onClick={() =>
                                handleSendFriendRequest(member._id)
                              }
                              className="p-1.5 text-blue-500 hover:text-blue-400"
                              title={t("groupInfo.addFriend")}
                            >
                              <FaUserPlus size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="px-4 py-4 border-t border-[#2f303b]">
            <div className="flex flex-col sm:flex-row gap-2">
              {isAdmin ? (
                <>
                  <Button
                    className="w-full sm:w-1/2 text-red-500 border border-red-500/30 bg-transparent hover:bg-red-500/10"
                    onClick={handleLeaveGroup}
                  >
                    <FaSignOutAlt className="mr-2" size={14} />
                    {t("groupInfo.leaveGroup")}
                  </Button>
                  <Button
                    className="w-full sm:w-1/2 bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleDeleteGroup}
                  >
                    <FaTrashAlt className="mr-2" size={14} />
                    {t("groupInfo.deleteGroup")}
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full text-red-500 border border-red-500/30 bg-transparent hover:bg-red-500/10"
                  onClick={handleLeaveGroup}
                >
                  <FaSignOutAlt className="mr-2" size={14} />
                  {t("groupInfo.leaveGroup")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog per selezionare il nuovo admin */}
      {showNewAdminDialog && (
        <NewAdminDialog
          open={showNewAdminDialog}
          onOpenChange={setShowNewAdminDialog}
          members={members.filter((m) => m._id !== user._id)}
          onAdminSelected={handleNewAdminSelected}
        />
      )}

      {/* Dialog di conferma per le azioni */}
      {showConfirmDialog && (
        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          action={confirmAction}
          member={selectedMember}
          onConfirm={handleConfirmAction}
        />
      )}

      {/* Dialog per aggiungere nuovi membri */}
      {showAddMembersDialog && (
        <AddMembersDialog
          open={showAddMembersDialog}
          onOpenChange={setShowAddMembersDialog}
          existingMembers={members.map((m) => m._id)}
          onMembersSelected={handleAddMembers}
        />
      )}

      {/* Dialog per visualizzare i media del gruppo */}
      {showMediaDialog && (
        <GroupMediaDialog
          open={showMediaDialog}
          onOpenChange={setShowMediaDialog}
          groupId={group._id}
        />
      )}
    </>
  );
}

export default GroupInfoDialog;
