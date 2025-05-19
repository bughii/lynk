import React, { useEffect, useState } from "react";
import { useFriendStore } from "@/store/friendStore";
import { FaUnlock } from "react-icons/fa";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { getProfileImage } from "@/lib/getProfileImage";

const BlockedUsersList = () => {
  const { t } = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch blocked users
  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/block/list");
      if (response.status === 200) {
        setBlockedUsers(response.data.blockedUsers || []);
      }
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      toast.error(t("block.errorFetchingBlockedUsers"));
    } finally {
      setLoading(false);
    }
  };

  // Unblock a user
  const handleUnblock = async (userId) => {
    try {
      const response = await apiClient.post("/api/block/unblock", {
        blockedUserId: userId,
      });

      if (response.status === 200) {
        // Update the local list
        setBlockedUsers(blockedUsers.filter((user) => user._id !== userId));
        toast.success(t("block.userUnblocked"));
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error(t("block.errorUnblocking"));
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  return (
    <ScrollArea className="h-[250px] pr-2">
      <div className="space-y-3">
        {loading ? (
          <div className="py-4 text-center text-gray-400">
            {t("common.loading")}...
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center text-gray-400 py-4 space-mono-regular">
            {t("block.noBlockedUsers")}
          </div>
        ) : (
          blockedUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 bg-[#1c1d25] rounded-lg hover:bg-[#2c2e3b] transition-colors space-mono-regular"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                  {user.image ? (
                    <AvatarImage
                      src={getProfileImage(user.image, user.avatar)}
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
              <Button
                onClick={() => handleUnblock(user._id)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 h-auto"
                title={t("block.unblock")}
              >
                <FaUnlock size={18} />
              </Button>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default BlockedUsersList;
