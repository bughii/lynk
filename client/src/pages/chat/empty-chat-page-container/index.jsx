import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import AddContact from "./add-contact";
import FriendRequests from "./received-requests";
import PendingRequests from "./sent-requests";
import FriendList from "./friend-list";

function EmptyChatContainer() {
  const [openFriendsDialog, setOpenFriendsDialog] = useState(false);
  const [openRequestsDialog, setOpenRequestsDialog] = useState(false);
  const [openPendingDialog, setOpenPendingDialog] = useState(false);
  const [openAddFriendDialog, setOpenAddFriendDialog] = useState(false);

  return (
    <div className="flex-1 md:bg-[#1c1d25] md:flex flex-col justify-start items-center hidden duration-1000 transition-all">
      <div className="w-full p-4 flex flex-col md:flex-row justify-between items-center border-b border-gray-700">
        <h1 className="space-mono-regular text-white text-2xl font-bold mb-4 md:mb-0">
          Amicizie
        </h1>
        <div className="flex flex-wrap justify-center md:justify-end gap-2 w-full md:w-auto">
          <Button
            variant="default"
            size="sm"
            className="flex-grow md:flex-grow-0"
            onClick={() => setOpenFriendsDialog(true)}
          >
            Tutti
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-grow md:flex-grow-0"
            onClick={() => setOpenRequestsDialog(true)}
          >
            Richieste
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-grow md:flex-grow-0"
            onClick={() => setOpenPendingDialog(true)}
          >
            In Attesa
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-grow md:flex-grow-0"
            onClick={() => setOpenAddFriendDialog(true)}
          >
            Aggiungi Amico
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="text-opacity-80 text-white flex flex-col gap-5 items-center mt-10 lg:text-4xl text-3xl transition-all duration-3000">
          <h3 className="space-mono-regular">
            Ciao<span className="text-purple-500">!</span> Benvenuto su{" "}
            <span className="text-purple-500">Lynk</span>.
          </h3>
        </div>
      </div>

      <Dialog open={openFriendsDialog} onOpenChange={setOpenFriendsDialog}>
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg">
          <h3 className="text-xl mb-4">I tuoi amici</h3>
          <FriendList />
        </DialogContent>
      </Dialog>

      <Dialog open={openRequestsDialog} onOpenChange={setOpenRequestsDialog}>
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg">
          <h3 className="text-xl mb-4">Richieste di Amicizia</h3>
          <FriendRequests />
        </DialogContent>
      </Dialog>

      <Dialog open={openPendingDialog} onOpenChange={setOpenPendingDialog}>
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg">
          <h3 className="text-xl mb-4">Richieste in Attesa</h3>
          <PendingRequests />
        </DialogContent>
      </Dialog>

      <Dialog open={openAddFriendDialog} onOpenChange={setOpenAddFriendDialog}>
        <DialogContent className="bg-[#181920] text-white p-4 rounded-lg">
          <h3 className="text-xl mb-4">Aggiungi un Amico</h3>
          <AddContact />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EmptyChatContainer;
