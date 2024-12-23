import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/utils";
import { useState } from "react";
import { HOST } from "@/utils/constants";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFriendStore } from "@/store/friendStore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
    <div className="flex flex-col">
      <Input
        placeholder={t(
          "mainpage.friendsDialog.addFriend.searchFriendPlaceholder"
        )}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          searchContacts(e.target.value);
        }}
        className="rounded-lg p-6 bg-[#2c2e3b] border-none mb-4"
      />
      <ScrollArea className="h-[250px]">
        <div className="flex flex-col gap-5">
          {searchedContacts.map((contact) => (
            <div
              key={contact._id}
              className="flex gap-3 items-center cursor-pointer"
            >
              <div>
                <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                  {contact.image ? (
                    <AvatarImage
                      src={`${HOST}/${contact.image} `}
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
              </div>
              <div className="space-mono-regular">{contact.userName}</div>
              <button
                className="ml-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
                onClick={() => sendFriendRequest(contact._id)}
              >
                {t("mainpage.friendsDialog.addFriend.addFriendButton")}
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default AddContact;
