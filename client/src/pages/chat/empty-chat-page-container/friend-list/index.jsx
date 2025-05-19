import React, { useEffect } from "react";
import { useFriendStore } from "@/store/friendStore";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FiUserMinus } from "react-icons/fi";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getProfileImage } from "@/lib/getProfileImage";

const FriendList = () => {
  const { friends, fetchFriends, removeFriend } = useFriendStore();
  const { t } = useTranslation();

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleRemoveFriend = async (friendId) => {
    try {
      const response = await removeFriend(friendId);
      if (response.status === 200) {
        toast.success(
          t("mainpage.friendsDialog.friendsList.friendRemovedSuccess")
        );
      }
    } catch (error) {
      toast.error(t("mainpage.friendsDialog.friendsList.friendRemovedError"));
    }
  };

  return (
    <ScrollArea className="h-[250px] pr-2">
      <div className="space-y-3">
        {friends.length === 0 ? (
          <div className="text-center text-gray-400 py-4 space-mono-regular">
            {t("mainpage.friendsDialog.friendsList.noFriends")}
          </div>
        ) : (
          friends.map((friend) => (
            <div
              key={friend._id}
              className="flex items-center justify-between p-3 bg-[#1c1d25] rounded-lg hover:bg-[#2c2e3b] transition-colors space-mono-regular"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                  {friend.image ? (
                    <AvatarImage
                      src={getProfileImage(friend.image, friend.avatar)}
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
                <div className="text-white">{friend.userName}</div>
              </div>
              <button
                onClick={() => handleRemoveFriend(friend._id)}
                className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                title={t("mainpage.friendsDialog.friendsList.removeFriend")}
              >
                <FiUserMinus size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default FriendList;
