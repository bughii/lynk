import React, { useState } from "react";
import logo from "@/assets/logosite.svg";
import ProfileInfoComponent from "./components/profile-info";
import AddContact from "../empty-chat-page-container/add-contact";
import FriendList from "../empty-chat-page-container/friend-list";
import FriendRequests from "../empty-chat-page-container/received-requests";
import PendingRequests from "../empty-chat-page-container/sent-requests";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FaUserFriends,
  FaUserPlus,
  FaUserClock,
  FaInbox,
  FaUsers,
  FaPlus,
} from "react-icons/fa";
import StartChat from "./components/start-chat";

function ContactsListContainer() {
  const [openFriendsDialog, setOpenFriendsDialog] = useState(false);
  const [openRequestsDialog, setOpenRequestsDialog] = useState(false);
  const [openPendingDialog, setOpenPendingDialog] = useState(false);
  const [openAddFriendDialog, setOpenAddFriendDialog] = useState(false);

  return (
    <div className="relative md:w-[40vw] lg:w-[30vw] xl:w-[20vw] bg-[#1b1c24] border-r-2 border-[#2f303b] w-full">
      <div className="pt-3 flex justify-center mb-10">
        <img src={logo} alt="logo" className="w-36 h-36 " />
      </div>

      <div className="flex justify-center mb-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-white text-2xl hover:text-purple-500 transition-colors">
              <FaUsers />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="bg-[#1b1c24] text-white">
            <DropdownMenuItem onClick={() => setOpenFriendsDialog(true)}>
              <FaUserFriends className="mr-2" /> Amici
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpenRequestsDialog(true)}>
              <FaInbox className="mr-2" /> Richieste
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpenPendingDialog(true)}>
              <FaUserClock className="mr-2" /> In Attesa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpenAddFriendDialog(true)}>
              <FaUserPlus className="mr-2" /> Aggiungi Amico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="my-5">
        <div className="flex items-center justify-between pr-10">
          <Title text="Messaggi" />
          <StartChat />
        </div>
      </div>
      <div className="my-5">
        <div className="flex items-center justify-between pr-10">
          <Title text="Gruppi" />
        </div>
      </div>

      <Dialog open={openFriendsDialog} onOpenChange={setOpenFriendsDialog}>
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg border-none">
          <h3 className="text-xl mb-4">I tuoi amici</h3>
          <FriendList />
        </DialogContent>
      </Dialog>

      <Dialog open={openRequestsDialog} onOpenChange={setOpenRequestsDialog}>
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg border-none">
          <h3 className="text-xl mb-4">Richieste di Amicizia</h3>
          <FriendRequests />
        </DialogContent>
      </Dialog>

      <Dialog open={openPendingDialog} onOpenChange={setOpenPendingDialog}>
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg border-none">
          <h3 className="text-xl mb-4">Richieste in Attesa</h3>
          <PendingRequests />
        </DialogContent>
      </Dialog>

      <Dialog open={openAddFriendDialog} onOpenChange={setOpenAddFriendDialog}>
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg border-none">
          <h3 className="text-xl mb-4">Aggiungi un Amico</h3>
          <AddContact />
        </DialogContent>
      </Dialog>

      <ProfileInfoComponent />
    </div>
  );
}

export default ContactsListContainer;

const Title = ({ text }) => {
  return (
    <h6 className="uppercase tracking-widest text-neutral-400 pl-5 font-light text-opacity-90 text-sm">
      {text}
    </h6>
  );
};
