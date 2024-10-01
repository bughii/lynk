import React, { useEffect, useState } from "react";
import { useFriendStore } from "@/store/friendStore";
import { FaCheck, FaTimes } from "react-icons/fa";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/utils";
import { toast } from "sonner";
import { HOST } from "@/utils/constants";
import { ScrollArea } from "@/components/ui/scroll-area";

const FriendRequests = () => {
  const {
    receivedRequests,
    fetchReceivedRequests,
    acceptRequest,
    rejectRequest,
  } = useFriendStore();

  // Fetching the received requests
  useEffect(() => {
    fetchReceivedRequests();
  }, []);

  const handleAccept = async (requestId) => {
    try {
      const data = await acceptRequest(requestId);
      if (data) {
        toast.success(data.message);
      }
    } catch (error) {
      console.error("Errore nell'accettare la richiesta:", error);
      toast.error(
        "Errore nell'accettare la richiesta: " +
          (error.response?.data?.message || "Errore sconosciuto.")
      );
    }
  };

  const handleReject = async (requestId) => {
    rejectRequest(requestId)
      .then((response) => {
        console.log("Risposta accettata:", response);
        if (response.status === 200) {
          toast.success(response.data.message);
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

  return (
    <div className="flex flex-col">
      <ScrollArea className="h-[250px]">
        <div className="flex flex-col gap-5">
          {receivedRequests.length === 0 ? (
            <p>Nessuna richiesta ricevuta.</p>
          ) : (
            receivedRequests.map((request) => {
              const user = request.requester;
              return (
                <div
                  key={request._id}
                  className="flex gap-3 items-center p-3 bg-[#1c1d25] rounded-lg"
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
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => handleAccept(request._id)}
                      className="text-green-500 hover:text-green-400"
                      title="Accetta"
                    >
                      <FaCheck size={20} />
                    </button>
                    <button
                      onClick={() => handleReject(request._id)}
                      className="text-red-500 hover:text-red-400"
                      title="Rifiuta"
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
    </div>
  );
};

export default FriendRequests;
