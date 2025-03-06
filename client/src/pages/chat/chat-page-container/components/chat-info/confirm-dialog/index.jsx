import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FaExclamationTriangle,
  FaUserMinus,
  FaSignOutAlt,
  FaTrashAlt,
} from "react-icons/fa";

function ConfirmDialog({ open, onOpenChange, action, member, onConfirm }) {
  const { t } = useTranslation();

  const getDialogContent = () => {
    switch (action) {
      case "removeMember":
        return {
          title: t("groupInfo.removeMemberTitle"),
          description: t("groupInfo.removeMemberDescription", {
            name: member?.userName || "",
          }).replace("{name}", member?.userName || ""),
          confirmText: t("groupInfo.remove"),
          icon: <FaUserMinus className="text-red-500" size={20} />,
        };
      case "leaveGroup":
        return {
          title: t("groupInfo.leaveGroupTitle"),
          description: t("groupInfo.leaveGroupDescription"),
          confirmText: t("groupInfo.leave"),
          icon: <FaSignOutAlt className="text-red-500" size={20} />,
        };
      case "deleteGroup":
        return {
          title: t("groupInfo.deleteGroupTitle"),
          description: t("groupInfo.deleteGroupDescription"),
          confirmText: t("groupInfo.delete"),
          icon: <FaTrashAlt className="text-red-500" size={20} />,
        };
      default:
        return {
          title: t("common.confirmAction"),
          description: t("common.confirmActionDescription"),
          confirmText: t("common.confirm"),
          icon: <FaExclamationTriangle className="text-yellow-500" size={20} />,
        };
    }
  };

  const content = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1b1c24] border-[#2f303b] text-white max-w-md w-full flex flex-col space-mono-regular">
        <DialogHeader className="px-4 py-4 border-b border-[#2f303b] flex-shrink-0 flex items-center">
          <div className="mr-3">{content.icon}</div>
          <DialogTitle className="text-lg font-medium">
            {content.title}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <p className="text-gray-300 mb-6">{content.description}</p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="w-full sm:w-1/2 bg-[#2c2e3b] hover:bg-[#363848] text-white"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="w-full sm:w-1/2 bg-red-500 hover:bg-red-600 text-white"
              onClick={onConfirm}
            >
              {content.confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
