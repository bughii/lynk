import { useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { FiEdit2 } from "react-icons/fi";
import { IoPowerSharp } from "react-icons/io5";
import FriendList from "@/pages/chat/empty-chat-page-container/friend-list";
import FriendRequests from "@/pages/chat/empty-chat-page-container/received-requests";
import PendingRequests from "@/pages/chat/empty-chat-page-container/sent-requests";
import AddContact from "@/pages/chat/empty-chat-page-container/add-contact";
import { useTranslation } from "react-i18next";
import BlockedUsersList from "@/pages/chat/empty-chat-page-container/blocked-users";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FaUsers,
  FaUserFriends,
  FaInbox,
  FaUserClock,
  FaUserPlus,
  FaUserSlash,
} from "react-icons/fa";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function ProfileInfoComponent() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openFriendsDialog, setOpenFriendsDialog] = useState(false);
  const [openRequestsDialog, setOpenRequestsDialog] = useState(false);
  const [openPendingDialog, setOpenPendingDialog] = useState(false);
  const [openAddFriendDialog, setOpenAddFriendDialog] = useState(false);
  const [openBlockedUsersDialog, setOpenBlockedUsersDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { t } = useTranslation();

  const handleLogout = async () => {
    setIsDialogOpen(false);
    logout();
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleDialogClose = () => {
    setOpenFriendsDialog(false);
    setOpenRequestsDialog(false);
    setOpenPendingDialog(false);
    setOpenAddFriendDialog(false);
    setDropdownOpen(false);
  };

  return (
    <div className="absolute bottom-4 h-20 flex items-center justify-between px-5 w-full bg-[#1b1c24]">
      <div className="flex gap-3 items-center justify-center">
        <div>
          <Avatar className="h-10 w-10 rounded-full overflow-hidden">
            {user.image ? (
              <AvatarImage
                src={`${HOST}/${user.image}`}
                alt="profile-image"
                className="object-cover w-full h-full bg-black"
              />
            ) : (
              <AvatarImage
                src={getAvatar(user.avatar)}
                alt="avatar"
                className="object-cover w-full h-full"
              />
            )}
          </Avatar>
        </div>
        <div className="space-mono-regular">
          {user.userName ? `${user.userName}` : ""}
        </div>
      </div>
      <div className="flex gap-5">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger className="text-purple-500 text-xl hover:text-purple-400 transition-colors">
            <FaUsers />
          </DropdownMenuTrigger>

          <DropdownMenuContent className="bg-[#1b1c24] text-white">
            <DropdownMenuItem
              onClick={() => {
                setOpenFriendsDialog(true);
                setDropdownOpen(false);
              }}
            >
              <FaUserFriends className="mr-2 h-4 w-4" />
              {t("mainpage.friendsDialog.friendsList.title")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setOpenRequestsDialog(true);
                setDropdownOpen(false);
              }}
            >
              <FaInbox className="mr-2 h-4 w-4" />{" "}
              {t("mainpage.friendsDialog.requestsList.title")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setOpenPendingDialog(true);
                setDropdownOpen(false);
              }}
            >
              <FaUserClock className="mr-2 h-4 w-4" />{" "}
              {t("mainpage.friendsDialog.pendingList.title")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setOpenAddFriendDialog(true);
                setDropdownOpen(false);
              }}
            >
              <FaUserPlus className="mr-2 h-4 w-4" />{" "}
              {t("mainpage.friendsDialog.addFriend.title")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setOpenBlockedUsersDialog(true);
                setDropdownOpen(false);
              }}
            >
              <FaUserSlash className="mr-2 h-4 w-4" />
              {t("mainpage.friendsDialog.blockedList.title")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <FiEdit2
          className="text-purple-500 text-xl font-medium cursor-pointer hover:text-purple-400 transition-colors"
          onClick={() => navigate("/settings")}
        />
        <IoPowerSharp
          className="text-red-500 text-xl font-medium cursor-pointer hover:text-red-400 transition-colors"
          onClick={handleOpenDialog}
        />
      </div>

      {/* Logout Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#1b1c24] text-white rounded-lg shadow-lg p-6 max-w-md w-full mx-auto">
            <div className="text-lg font-bold">
              {t("mainpage.logoutDialog.logoutTitle")}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {t("mainpage.logoutDialog.logoutBody")}
            </p>
            <div className="flex justify-end gap-4 mt-4">
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                onClick={handleCloseDialog}
              >
                {t("mainpage.logoutDialog.cancelButton")}
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                onClick={handleLogout}
              >
                {t("mainpage.logoutDialog.logoutButton")}
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={openFriendsDialog}
        onOpenChange={(open) => {
          setOpenFriendsDialog(open);
          if (!open) handleDialogClose();
        }}
      >
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg border-none">
          <h3 className="text-xl mb-4">
            {t("mainpage.friendsDialog.friendsList.title")}
          </h3>
          <FriendList />
        </DialogContent>
      </Dialog>

      <Dialog
        open={openRequestsDialog}
        onOpenChange={(open) => {
          setOpenRequestsDialog(open);
          if (!open) handleDialogClose();
        }}
      >
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg border-none">
          <h3 className="text-xl mb-4">
            {t("mainpage.friendsDialog.requestsList.title")}
          </h3>
          <FriendRequests />
        </DialogContent>
      </Dialog>

      <Dialog
        open={openPendingDialog}
        onOpenChange={(open) => {
          setOpenPendingDialog(open);
          if (!open) handleDialogClose();
        }}
      >
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg border-none">
          <h3 className="text-xl mb-4">
            {t("mainpage.friendsDialog.pendingList.title")}
          </h3>
          <PendingRequests />
        </DialogContent>
      </Dialog>

      <Dialog
        open={openAddFriendDialog}
        onOpenChange={(open) => {
          setOpenAddFriendDialog(open);
          if (!open) handleDialogClose();
        }}
      >
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg border-none">
          <h3 className="text-xl mb-4">
            {t("mainpage.friendsDialog.addFriend.title")}
          </h3>
          <AddContact />
        </DialogContent>
      </Dialog>
      <Dialog
        open={openBlockedUsersDialog}
        onOpenChange={(open) => {
          setOpenBlockedUsersDialog(open);
          if (!open) handleDialogClose();
        }}
      >
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg border-none">
          <h3 className="text-xl mb-4">
            {t("mainpage.friendsDialog.blockedList.title")}
          </h3>
          <BlockedUsersList />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProfileInfoComponent;
