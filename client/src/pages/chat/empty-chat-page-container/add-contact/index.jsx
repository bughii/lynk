import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/utils";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFriendStore } from "@/store/friendStore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";
import { getProfileImage } from "@/lib/getProfileImage";

function AddContact() {
  const [searchedContacts, setSearchedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { addContact } = useAuthStore();
  const { sendRequest } = useFriendStore();
  const { t } = useTranslation();

  const searchContacts = async (searchTerm) => {
    try {
      if (searchTerm.length > 0) {
        const response = await addContact(searchTerm);
        if (response.status === 200 && response.data.contacts) {
          setSearchedContacts(response.data.contacts);
        }
      } else {
        setSearchedContacts([]);
      }
    } catch (error) {
      console.log({ error });
    }
  };

  const sendFriendRequest = async (contactId) => {
    try {
      const response = await sendRequest(contactId);
      if (response.status === 200) {
        toast.success(t("mainpage.friendsDialog.addFriend.requestSentSuccess"));
      } else {
        toast.error(t("mainpage.friendsDialog.addFriend.requestSentError"));
      }
    } catch (error) {
      toast.error(t("mainpage.friendsDialog.addFriend.requestSentError"));
    }
  };
  return (
    <div className="flex flex-col space-mono-regular">
      <div className="relative mb-4">
        <input
          type="text"
          placeholder={t(
            "mainpage.friendsDialog.addFriend.searchFriendPlaceholder"
          )}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            searchContacts(e.target.value);
          }}
          className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#2c2e3b] border-none text-white focus:ring-1 focus:ring-[#126319]"
        />
        <FaSearch
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          size={16}
        />
      </div>
      <ScrollArea className="h-[250px] pr-2">
        <div className="space-y-3">
          {searchedContacts.length === 0 ? (
            <div className="text-center text-gray-400 py-4">
              {t("mainpage.noSearchResults")}
            </div>
          ) : (
            searchedContacts.map((contact) => (
              <div
                key={contact._id}
                className="flex items-center justify-between p-3 bg-[#1c1d25] rounded-lg hover:bg-[#2c2e3b] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                    {contact.image ? (
                      <AvatarImage
                        src={getProfileImage(contact.image, contact.avatar)}
                        alt="profile-image"
                        className="object-cover w-full h-full bg-black"
                      />
                    ) : (
                      <AvatarImage
                        src={getAvatar(contact.avatar)}
                        alt="avatar"
                        className="object-cover w-full h-full"
                      />
                    )}
                  </Avatar>
                  <div className="text-white">{contact.userName}</div>
                </div>
                <button
                  className="bg-[#126319] text-white px-4 py-2 rounded-lg hover:bg-[#1a8f24] transition-colors"
                  onClick={() => sendFriendRequest(contact._id)}
                >
                  {t("mainpage.friendsDialog.addFriend.addFriendButton")}
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default AddContact;
