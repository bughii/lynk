import React, { useEffect } from "react";
import { useFriendStore } from "@/store/friendStore";
import { FaTimes } from "react-icons/fa";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/utils";
import { toast } from "sonner";
import { HOST } from "@/utils/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";

const PendingRequests = () => {
  const { sentRequests, fetchSentRequests, rejectRequest, error } =
    useFriendStore();
  const { t } = useTranslation();

  useEffect(() => {
    fetchSentRequests();
  }, []);

  const handleCancel = async (requestId) => {
    try {
      await rejectRequest(requestId);
      toast.success(
        t("mainpage.friendsDialog.pendingList.requestCancelledSuccess")
      );
      fetchSentRequests();
    } catch (error) {
      toast.error(
        t("mainpage.friendsDialog.pendingList.requestCancelledError")
      );
    }
  };

  if (error) {
    return (
      <p className="text-red-500 text-center space-mono-regular">{error}</p>
    );
  }

  return (
    <ScrollArea className="h-[250px] pr-2">
      <div className="space-y-3">
        {sentRequests.length === 0 ? (
          <div className="text-center text-gray-400 py-4 space-mono-regular">
            {t("mainpage.friendsDialog.pendingList.noPending")}
          </div>
        ) : (
          sentRequests.map((request) => {
            const user = request.recipient;
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
                <button
                  onClick={() => handleCancel(request._id)}
                  className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                  title={t("mainpage.friendsDialog.pendingList.cancel")}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
};

export default PendingRequests;
