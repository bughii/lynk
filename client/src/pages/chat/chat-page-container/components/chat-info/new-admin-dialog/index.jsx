import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";
import { FaCrown, FaCheck } from "react-icons/fa";

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
      <DialogContent className="bg-[#1b1c24] border-[#2f303b] text-white max-w-md w-full max-h-[85vh] flex flex-col space-mono-regular">
        <DialogHeader className="px-4 py-4 border-b border-[#2f303b] flex-shrink-0">
          <DialogTitle className="text-lg font-medium text-center">
            {t("groupInfo.selectNewAdmin")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 flex-shrink-0">
          <div className="bg-[#2c2e3b] text-gray-300 text-sm p-4 rounded-md">
            {t("groupInfo.selectNewAdminDescription")}
          </div>
        </div>

        <ScrollArea className="flex-grow overflow-auto px-4 py-4">
          <div className="space-y-1">
            {members.map((member) => {
              const isSelected = selectedMemberId === member._id;

              return (
                <div
                  key={member._id}
                  className={`flex items-center py-2 px-3 hover:bg-[#2f303b] rounded-lg transition-colors cursor-pointer ${
                    isSelected ? "bg-[#126319]/20" : ""
                  }`}
                  onClick={() => handleSelectMember(member._id)}
                >
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

                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {member.userName}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="bg-[#126319] text-white p-2 rounded-full">
                      <FaCrown size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="px-4 py-4 border-t border-[#2f303b] flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="w-full sm:w-1/2 bg-[#2c2e3b] hover:bg-[#363848] text-white transition-all"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!selectedMemberId}
              onClick={handleConfirm}
              className="w-full sm:w-1/2 bg-[#126319] hover:bg-[#1a8f24] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t("common.confirm")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NewAdminDialog;
