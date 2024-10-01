import React, { useEffect } from "react";
import { useFriendStore } from "@/store/friendStore";
import { FaTimes } from "react-icons/fa";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/utils";
import { toast } from "sonner";
import { HOST } from "@/utils/constants";
import { ScrollArea } from "@/components/ui/scroll-area";

const PendingRequests = () => {
  const { sentRequests, fetchSentRequests, rejectRequest, error } =
    useFriendStore();

  // Fetching the sent requests
  useEffect(() => {
    fetchSentRequests();
  }, []);

  const handleCancel = async (requestId) => {
    rejectRequest(requestId)
      .then((response) => {
        console.log("Risposta accettata:", response);
        if (response.status === 200) {
          toast.success("Richiesta di amicizia annullata");
          fetchSentRequests();
        }
      })
      .catch((error) => {
        if (error.response) {
          console.error("Errore nella risposta del server:", error.response);
          toast.error(`Errore: ${error.response.data.message}`);
        } else if (error.request) {
          console.error("Nessuna risposta ricevuta:", error.request);
          toast.error("Nessuna risposta dal server.");
        } else {
          console.error("Errore nella richiesta:", error.message);
          toast.error(`Errore nella richiesta: ${error.message}`);
        }
      });
  };

  if (error) {
    return <p>Errore: {error}</p>;
  }

  return (
    <div className="flex flex-col">
      {sentRequests.length === 0 ? (
        <p>Nessuna richiesta inviata.</p>
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
                      title="Annulla richiesta"
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
