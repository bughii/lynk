// client/src/pages/chat/chat-page-container/components/chat-info/new-admin-dialog.jsx

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

function NewAdminDialog({ open, onOpenChange, members, onAdminSelected }) {
  const { t } = useTranslation();
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const handleSelectMember = (memberId) => {
    setSelectedMemberId(memberId);
  };

  const handleConfirm = () => {
    if (selectedMemberId) {
      onAdminSelected(selectedMemberId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1b1c24] border-[#2c2e3b] text-white max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {t("groupInfo.selectNewAdmin")}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-gray-300 text-sm mb-4">
            {t("groupInfo.selectNewAdminDescription")}
          </p>

          <ScrollArea className="h-60 pr-4">
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member._id}
                  className={`flex items-center px-3 py-2 bg-[#2c2e3b] rounded-lg hover:bg-[#363848] transition-colors cursor-pointer ${
                    selectedMemberId === member._id
                      ? "ring-2 ring-[#126319]"
                      : ""
                  }`}
                  onClick={() => handleSelectMember(member._id)}
                >
                  <Avatar className="h-10 w-10 rounded-full overflow-hidden mr-3">
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

                  <span className="text-white">{member.userName}</span>
                </div>
              ))}
            </div>
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
            disabled={!selectedMemberId}
            onClick={handleConfirm}
            className="bg-[#126319] hover:bg-[#1a8f24]"
          >
            {t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewAdminDialog;
