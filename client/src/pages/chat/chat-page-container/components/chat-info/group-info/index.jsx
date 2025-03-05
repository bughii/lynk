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
} from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import NewAdminDialog from "../new-admin-dialog";
import ConfirmDialog from "../confirm-dialog";
import { useSocket } from "@/context/SocketContext";
import AddMembersDialog from "./add-members-dialog";

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

  const handleLeaveGroup = async () => {
    try {
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
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error(t("groupInfo.leaveGroupError"));
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

        console.log("Emitting membersAdded event:", {
          groupId: group._id,
          memberIds: selectedFriends.map((friend) => friend._id),
        });

        // Emetti evento socket per notificare i nuovi membri
        if (socket) {
          socket.emit("membersAdded", {
            groupId: group._id,
            memberIds: selectedFriends.map((friend) => friend._id),
          });
        } else {
          console.warn("Socket not available for membersAdded event");
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
        <DialogContent className="bg-[#1b1c24] border-[#2c2e3b] text-white max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {group?.name || t("groupInfo.groupInformation")}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-300">
                {t("groupInfo.members")} ({sortedMembers.length})
              </h3>

              {/* Pulsante per aggiungere membri (solo per admin) */}
              {isAdmin && (
                <button
                  onClick={() => setShowAddMembersDialog(true)}
                  className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <FaUserFriends size={16} />
                  <span>{t("groupInfo.addMembers")}</span>
                </button>
              )}
            </div>

            <ScrollArea className="h-60 pr-4">
              {isLoading ? (
                <div className="flex justify-center py-4 text-gray-400">
                  {t("common.loading")}...
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedMembers.map((member) => {
                    const isCurrentUser = member.isCurrentUser;
                    const memberIsFriend = isFriend(member._id);

                    return (
                      <div
                        key={member._id}
                        className="flex items-center justify-between px-3 py-2 bg-[#2c2e3b] rounded-lg hover:bg-[#363848] transition-colors"
                      >
                        <div
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => handleMemberClick(member)}
                        >
                          <Avatar className="h-10 w-10 rounded-full overflow-hidden">
                            {member.image ? (
                              <AvatarImage
                                src={`${HOST}/${member.image}`}
                                alt="profile-image"
                                className="object-cover w-full h-full bg-black"
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
                              <span className="text-white">
                                {isCurrentUser
                                  ? t("groupInfo.you")
                                  : member.userName}
                              </span>

                              {member.isAdmin && (
                                <FaCrown
                                  className="ml-2 text-yellow-500"
                                  size={16}
                                  title={t("groupInfo.admin")}
                                />
                              )}
                            </div>

                            {isCurrentUser && member.isAdmin && (
                              <span className="text-xs text-gray-400">
                                {t("groupInfo.youAreAdmin")}
                              </span>
                            )}
                          </div>
                        </div>

                        {!isCurrentUser && isAdmin && (
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="p-2 text-red-500 hover:text-red-400 transition-colors"
                            title={t("groupInfo.removeMember")}
                          >
                            <FaUserMinus size={16} />
                          </button>
                        )}

                        {!isCurrentUser && !memberIsFriend && (
                          <button
                            onClick={() => handleSendFriendRequest(member._id)}
                            className="p-2 text-blue-500 hover:text-blue-400 transition-colors"
                            title={t("groupInfo.addFriend")}
                          >
                            <FaUserPlus size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            {isAdmin ? (
              <>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-500/10"
                  onClick={handleLeaveGroup}
                >
                  {t("groupInfo.leaveGroup")}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto"
                  onClick={handleDeleteGroup}
                >
                  {t("groupInfo.deleteGroup")}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
                onClick={handleLeaveGroup}
              >
                {t("groupInfo.leaveGroup")}
              </Button>
            )}
          </DialogFooter>
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
    </>
  );
}

export default GroupInfoDialog;
