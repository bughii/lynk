import React, { useEffect } from "react";
import { useFriendStore } from "@/store/friendStore";
import { FaTimes } from "react-icons/fa";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/utils";
import { HOST } from "@/utils/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FiUserMinus } from "react-icons/fi";
import { toast } from "sonner";

const FriendList = () => {
  const { friends, fetchFriends, removeFriend } = useFriendStore();

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleRemoveFriend = async (friendId) => {
    try {
      const response = await removeFriend(friendId);
      console.log("Risposta accettata:", response);
      if (response.status === 200) {
        toast.success("Richiesta di amicizia annullata");
      }
    } catch (error) {
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
    }
  };

  return (
    <div>
      <ScrollArea className="h-[250px]">
        <div className="flex flex-col gap-5">
          {friends.length === 0 ? (
            <p>Nessun amico.</p>
          ) : (
            friends.map((friend) => (
              <div
                key={friend._id}
                className="flex items-center justify-between gap-3 p-2 bg-[#1c1d25] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                    {friend.image ? (
                      <AvatarImage
                        src={`${HOST}/${friend.image}`}
                        alt="profile-image"
                        className="object-cover w-full h-full bg-black"
                      />
                    ) : (
                      <AvatarImage
                        src={getAvatar(friend.avatar)}
                        alt="avatar"
                        className="object-cover w-full h-full"
                      />
                    )}
                  </Avatar>
                  <div className="space-mono-regular text-white">
                    {friend.userName ? `${friend.userName}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFriend(friend._id)}
                  className="text-white hover:text-red-500 transition-colors duration-200 pr-5"
                  title="Rimuovi amico"
                >
                  <FiUserMinus size={24} />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FriendList;
