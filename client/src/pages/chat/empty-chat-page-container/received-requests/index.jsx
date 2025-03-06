import React, { useEffect, useState } from "react";
import { useFriendStore } from "@/store/friendStore";
import { FaCheck, FaTimes } from "react-icons/fa";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/utils";
import { toast } from "sonner";
import { HOST } from "@/utils/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

const FriendRequests = () => {
  const {
    receivedRequests,
    fetchReceivedRequests,
    acceptRequest,
    rejectRequest,
  } = useFriendStore();
  const { t } = useTranslation();

  useEffect(() => {
    fetchReceivedRequests();
  }, []);

  const handleAccept = async (requestId) => {
    try {
      await acceptRequest(requestId);
      toast.success(
        t("mainpage.friendsDialog.requestsList.requestAcceptedSuccess")
      );
    } catch (error) {
      toast.error(
        t("mainpage.friendsDialog.requestsList.requestAcceptedError")
      );
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectRequest(requestId);
      toast.success(
        t("mainpage.friendsDialog.requestsList.requestRejectedSuccess")
      );
    } catch (error) {
      toast.error(
        t("mainpage.friendsDialog.requestsList.requestRejectedError")
      );
    }
  };

  return (
    <ScrollArea className="h-[250px] pr-2">
      <div className="space-y-3">
        {receivedRequests.length === 0 ? (
          <div className="text-center text-gray-400 py-4 space-mono-regular">
            {t("mainpage.friendsDialog.requestsList.noRequests")}
          </div>
        ) : (
          receivedRequests.map((request) => {
            const user = request.requester;
            return (
              <div
                key={request._id}
                className="flex items-center justify-between p-3 bg-[#1c1d25] rounded-lg hover:bg-[#2c2e3b] transition-colors space-mono-regular"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-full overflow-hidden">
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
                  <div className="text-white">{user.userName}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(request._id)}
                    className="text-green-500 hover:text-green-400 p-2 rounded-full hover:bg-green-500/10 transition-colors"
                    title={t("mainpage.friendsDialog.requestsList.accept")}
                  >
                    <FaCheck size={20} />
                  </button>
                  <button
                    onClick={() => handleReject(request._id)}
                    className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                    title={t("mainpage.friendsDialog.requestsList.reject")}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
};

export default FriendRequests;
