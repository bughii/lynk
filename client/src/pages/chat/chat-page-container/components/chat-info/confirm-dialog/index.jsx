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
            name: member?.userName,
          }),
          confirmText: t("groupInfo.remove"),
          destructive: true,
          icon: <FaUserMinus className="text-red-400 text-2xl" />,
          gradient: "from-red-500/20 to-orange-500/20",
          bgButton: "bg-red-500 hover:bg-red-600",
          bgIconWrapper: "bg-red-500/10",
        };
      case "leaveGroup":
        return {
          title: t("groupInfo.leaveGroupTitle"),
          description: t("groupInfo.leaveGroupDescription"),
          confirmText: t("groupInfo.leave"),
          destructive: true,
          icon: <FaSignOutAlt className="text-orange-400 text-2xl" />,
          gradient: "from-orange-500/20 to-yellow-500/20",
          bgButton: "bg-orange-500 hover:bg-orange-600",
          bgIconWrapper: "bg-orange-500/10",
        };
      case "deleteGroup":
        return {
          title: t("groupInfo.deleteGroupTitle"),
          description: t("groupInfo.deleteGroupDescription"),
          confirmText: t("groupInfo.delete"),
          destructive: true,
          icon: <FaTrashAlt className="text-red-400 text-2xl" />,
          gradient: "from-red-600/20 to-red-400/20",
          bgButton: "bg-red-500 hover:bg-red-600",
          bgIconWrapper: "bg-red-500/10",
        };
      default:
        return {
          title: t("common.confirmAction"),
          description: t("common.confirmActionDescription"),
          confirmText: t("common.confirm"),
          destructive: false,
          icon: <FaExclamationTriangle className="text-yellow-400 text-2xl" />,
          gradient: "from-yellow-500/20 to-amber-500/20",
          bgButton: "bg-blue-500 hover:bg-blue-600",
          bgIconWrapper: "bg-yellow-500/10",
        };
    }
  };

  const content = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1b1c24] border-[#2c2e3b] text-white max-w-sm w-full p-0 overflow-hidden">
        <div
          className={`bg-gradient-to-r ${content.gradient} p-6 flex items-center gap-4`}
        >
          <div className={`p-3 rounded-full ${content.bgIconWrapper}`}>
            {content.icon}
          </div>
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-semibold text-white">
              {content.title}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6">
          <p className="text-gray-300 leading-relaxed">{content.description}</p>

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-8">
            <Button
              className="bg-[#2c2e3b] hover:bg-[#363848] text-white border-none transition-colors rounded-xl py-2.5"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className={`${content.bgButton} text-white transition-colors rounded-xl py-2.5`}
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
