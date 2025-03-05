// client/src/pages/chat/chat-page-container/components/chat-info/confirm-dialog.jsx

import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
        };
      case "leaveGroup":
        return {
          title: t("groupInfo.leaveGroupTitle"),
          description: t("groupInfo.leaveGroupDescription"),
          confirmText: t("groupInfo.leave"),
          destructive: true,
        };
      case "deleteGroup":
        return {
          title: t("groupInfo.deleteGroupTitle"),
          description: t("groupInfo.deleteGroupDescription"),
          confirmText: t("groupInfo.delete"),
          destructive: true,
        };
      default:
        return {
          title: t("common.confirmAction"),
          description: t("common.confirmActionDescription"),
          confirmText: t("common.confirm"),
          destructive: false,
        };
    }
  };

  const content = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1b1c24] border-[#2c2e3b] text-white max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-xl">{content.title}</DialogTitle>
        </DialogHeader>

        <div className="my-4">
          <p className="text-gray-300">{content.description}</p>
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
            variant={content.destructive ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {content.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
