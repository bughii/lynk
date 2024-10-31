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

  // Fetching the sent requests
  useEffect(() => {
    fetchSentRequests();
  }, []);

  const handleCancel = async (requestId) => {
    rejectRequest(requestId)
      .then((response) => {
        console.log("Risposta accettata:", response);
        if (response.status === 200) {
          toast.success(
            t("mainpage.friendsDialog.pendingList.requestCancelledSuccess")
          );
          fetchSentRequests();
        }
      })
      .catch((error) => {
        toast.error(
          t("mainpage.friendsDialog.pendingList.requestCancelledError")
        );
      });
  };

  if (error) {
    return <p>Errore: {error}</p>;
  }

  return (
    <div className="flex flex-col">
      {sentRequests.length === 0 ? (
        <p>{t("mainpage.friendsDialog.pendingList.noPending")}</p>
      ) : (
        <ScrollArea className="h-[250px]">
          {" "}
          <div className="space-y-4">
            {sentRequests.map((request) => {
              const user = request.recipient;
              return (
                <div
                  key={request._id}
                  className="flex items-center gap-3 p-2 bg-[#1c1d25] rounded-lg"
                >
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

                  <div className="space-mono-regular text-white">
                    {user.userName ? `${user.userName}` : ""}
                  </div>

                  <div className="ml-auto">
                    <button
                      onClick={() => handleCancel(request._id)}
                      className="text-red-500 hover:text-red-400 mr-4"
                      title={t("mainpage.friendsDialog.pendingList.cancel")}
                    >
                      <FaTimes size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default PendingRequests;
