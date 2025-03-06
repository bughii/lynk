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
      <DialogContent className="bg-[#1b1c24] border-[#2c2e3b] text-white max-w-md w-full max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <FaCrown className="text-yellow-500" />
            {t("groupInfo.selectNewAdmin")}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 flex-1 overflow-hidden flex flex-col">
          <div
            className="bg-[#2c2e3b]/80 text-gray-300 text-sm p-4 rounded-xl mb-6 shadow-inner"
            style={{ boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.2)" }}
          >
            {t("groupInfo.selectNewAdminDescription")}
          </div>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-2">
              {members.map((member) => {
                const isSelected = selectedMemberId === member._id;

                return (
                  <div
                    key={member._id}
                    className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-yellow-500/20 hover:bg-yellow-500/30 shadow-sm"
                        : "bg-[#2c2e3b] hover:bg-[#363848]"
                    }`}
                    onClick={() => handleSelectMember(member._id)}
                  >
                    <div className="relative mr-3">
                      <Avatar
                        className={`h-12 w-12 rounded-full overflow-hidden ${
                          isSelected
                            ? "ring-2 ring-yellow-500 ring-offset-1 ring-offset-[#1b1c24]"
                            : ""
                        }`}
                      >
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
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 shadow-md">
                          <FaCheck size={10} className="text-[#1b1c24]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <span className="text-white font-medium">
                        {member.userName}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="ml-2 bg-yellow-500 text-[#1b1c24] p-2 rounded-full shadow-sm">
                        <FaCrown size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <div className="p-4 border-t border-[#2c2e3b]">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-[#2c2e3b] hover:bg-[#363848] text-gray-300 hover:text-white border-none transition-colors rounded-xl py-5"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!selectedMemberId}
              onClick={handleConfirm}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-[#1b1c24] font-medium disabled:bg-yellow-500/50 disabled:text-[#1b1c24]/50 transition-colors rounded-xl py-5"
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
