import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { avatars, getAvatar } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "@/utils/i18n";
import {
  FaGlobe,
  FaPlus,
  FaTrash,
  FaUser,
  FaPaintBrush,
  FaCog,
} from "react-icons/fa";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { HOST, UPDATE_APPEARANCE_ROUTE } from "@/utils/constants";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { FaArrowLeft } from "react-icons/fa";
import { useSocket } from "@/context/SocketContext";
import { FaExclamationTriangle } from "react-icons/fa";
import { getProfileImage } from "@/lib/getProfileImage";

const CHAT_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#8B5CF6", // purple
  "#F97316", // orange
  "#EC4899", // pink
];
const FONT_SIZES = {
  small: "1rem",
  medium: "2rem",
  large: "3rem",
};

const Settings = () => {
  const { user, updateProfile, updateProfileImage, removeProfileImage } =
    useAuthStore();
  const { updateChatColors, chatColors } = useChatStore();
  const [image, setImage] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar ?? 0);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("profile");

  const { i18n, t } = useTranslation();
  const { language, setLanguage } = useChatStore();
  const socket = useSocket();

  // Initialize state with values from chatStore
  const [sentMessageColor, setSentMessageColor] = useState(
    chatColors.sentMessageColor || CHAT_COLORS[0]
  );
  const [receivedMessageColor, setReceivedMessageColor] = useState(
    chatColors.receivedMessageColor || CHAT_COLORS[2]
  );
  const [fontSize, setFontSize] = useState(chatColors.fontSize || "medium");
  const fileInputRef = useRef(null);

  const [selectedLanguage, setSelectedLanguage] = useState(language);

  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
      setSelectedLanguage(language);
    }
  }, [language, i18n]);

  useEffect(() => {
    // If the avatar in the global store exists and is different from local state, update local state
    // Default to 0 if store has null/undefined avatar
    const storeAvatar = user?.avatar ?? 0;
    if (storeAvatar !== selectedAvatar) {
      setSelectedAvatar(storeAvatar);
    }
    // Also sync the local preview 'image' state if the user image changes in the store
    if (user?.image) {
      setImage(user.image);
    } else {
      setImage(null); // Clear local preview if store has no image
    }
    // Depend on the user object from the store
  }, [user?.avatar, user?.image]);

  useEffect(() => {
    setSentMessageColor(chatColors.sentMessageColor || CHAT_COLORS[0]);
    setReceivedMessageColor(chatColors.receivedMessageColor || CHAT_COLORS[2]);
    setFontSize(chatColors.fontSize || "medium");
  }, [chatColors]);

  useEffect(() => {
    if (user) {
      setSelectedAvatar(user.avatar || 0);
      setUsername(user.userName || "");
      if (user.image) {
        setImage(user.image);
      }
    }
  }, [user]);

  const renderMainAvatar = () => {
    const finalSrc = getProfileImage(user?.image, user?.avatar);

    return (
      <AvatarImage
        key={finalSrc}
        src={finalSrc}
        alt={user?.image ? "profile-image" : "avatar"}
        className="object-cover rounded-full"
      />
    );
  };

  const handleBackToChat = () => {
    navigate("/chat");
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const loginDate = new Date(date);
    const diffTime = Math.abs(now - loginDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} ${
        diffDays === 1
          ? t("settings.others.timeAgo.daySingular")
          : t("settings.others.timeAgo.dayPlural")
      } ${t("settings.others.timeAgo.ago")}`;
    } else if (diffHours > 0) {
      return `${diffHours} ${
        diffHours === 1
          ? t("settings.others.timeAgo.hourSingular")
          : t("settings.others.timeAgo.hourPlural")
      } ${t("settings.others.timeAgo.ago")}`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} ${
        diffMinutes === 1
          ? t("settings.others.timeAgo.minuteSingular")
          : t("settings.others.timeAgo.minutePlural")
      } ${t("settings.others.timeAgo.ago")}`;
    } else {
      return t("settings.others.timeAgo.justNow");
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("profile-image", file);
      try {
        const response = await updateProfileImage(formData);

        if (response?.status === 200 && response.data?.image) {
          toast.success(t("settings.imageUpdatedSuccess"));
          const reader = new FileReader();
          reader.onload = () => setImage(reader.result);

          reader.readAsDataURL(file);

          if (socket && socket.connected) {
            const serverRelativeImagePath = response.data.image;

            socket.emit("profileImageUpdated", {
              userId: user._id,
              imageUrl: serverRelativeImagePath,
            });
          }
        }
      } catch (error) {
        toast.error(t("settings.imageUpdateError"));
      }
    }
  };

  const handleDeleteImage = async () => {
    try {
      const response = await removeProfileImage();
      if (response.status === 200) {
        setImage(null);
        toast.success(t("settings.imageRemovedSuccess"));
      }
    } catch (error) {
      toast.error(t("settings.imageRemovedError"));
    }
  };

  const saveSettingsProfile = async () => {
    // Use the current local state which should be synced
    const avatarToSave = selectedAvatar;

    try {
      const profileData = { avatar: avatarToSave };

      const response = await updateProfile(profileData);

      if (response && response.status === 200) {
        toast.success(t("settings.saveChatSettingsSuccess"));

        if (socket && socket.connected) {
          const avatarAssetPath = getAvatar(avatarToSave);
          socket.emit("profileImageUpdated", {
            userId: user._id,
            imageUrl: avatarAssetPath,
          });
        } else {
          console.warn("Socket not connected, cannot emit profile update.");
        }
      } else {
        toast.error(
          response?.data?.message || t("settings.saveChatSettingsError")
        );
      }
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast.error(t("settings.saveChatSettingsError"));
    }
  };

  const saveSettings = async () => {
    try {
      const response = await apiClient.post(UPDATE_APPEARANCE_ROUTE, {
        sentMessageColor,
        receivedMessageColor,
        fontSize,
      });
      if (response.status === 200) {
        updateChatColors({
          sentMessageColor,
          receivedMessageColor,
          fontSize,
        });
        toast.success(t("settings.saveChatSettingsSuccess"));
      }
    } catch (error) {
      toast.error(t("settings.saveChatSettingsError"));
    }
  };

  const saveLanguageSettings = () => {
    try {
      i18n.changeLanguage(selectedLanguage);
      setLanguage(selectedLanguage);
      toast.success(t("settings.saveLanguageSuccess"));
    } catch (error) {
      toast.error(t("settings.saveLanguageError"));
    }
  };

  const MessagePreview = ({ color, type }) => (
    <div className="flex justify-start">
      <div
        className="inline-block p-3 rounded-lg break-words"
        style={{
          backgroundColor:
            type === "sent"
              ? "rgba(42, 43, 51, 0.05)"
              : "rgba(22, 66, 91, 0.05)",
          borderColor: color,
          borderWidth: "1px",
          color: color,
          fontSize: FONT_SIZES[fontSize],
          maxWidth: "250px",
        }}
      >
        {type === "sent"
          ? t("settings.appearance.messagePreviewSent")
          : t("settings.appearance.messagePreviewReceived")}
        <div className="text-xs text-gray-500 mt-1">12:30</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1b1c24] flex space-mono-regular">
      {/* Side navbar*/}
      <nav className="w-64 bg-[#2c2e3b] p-4 flex flex-col space-y-4">
        <div className="mb-6 space-y-4">
          <Button
            onClick={handleBackToChat}
            variant="ghost"
            className="p-2 bg-[#126319] text-white w-8 h-8 flex items-center justify-center rounded-lg"
            title={t("settings.sidebar.backToChat")}
          >
            <FaArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-white text-xl font-bold mb-6">
            {t("settings.sidebar.settingsTitle")}
          </h1>
        </div>
        <button
          className={`flex items-center text-white p-2 rounded-md hover:bg-[#3b3c48] ${
            activeSection === "profile" ? "bg-[#3b3c48]" : ""
          }`}
          onClick={() => setActiveSection("profile")}
        >
          <FaUser className="mr-2" /> {t("settings.sidebar.profile")}
        </button>
        <button
          className={`flex items-center text-white p-2 rounded-md hover:bg-[#3b3c48] ${
            activeSection === "appearance" ? "bg-[#3b3c48]" : ""
          }`}
          onClick={() => setActiveSection("appearance")}
        >
          <FaPaintBrush className="mr-2" /> {t("settings.sidebar.appearance")}
        </button>
        <button
          className={`flex items-center text-white p-2 rounded-md hover:bg-[#3b3c48] ${
            activeSection === "language" ? "bg-[#3b3c48]" : ""
          }`}
          onClick={() => setActiveSection("language")}
        >
          <FaGlobe className="mr-2" /> {t("settings.sidebar.language")}
        </button>
        <button
          className={`flex items-center text-white p-2 rounded-md hover:bg-[#3b3c48] ${
            activeSection === "settings" ? "bg-[#3b3c48]" : ""
          }`}
          onClick={() => setActiveSection("settings")}
        >
          <FaCog className="mr-2" /> {t("settings.sidebar.others")}
        </button>
      </nav>

      <div className="flex-1 p-8 space-y-10">
        {activeSection === "profile" && (
          <div className="space-y-8">
            <h2 className="text-white text-2xl font-semibold">
              {t("settings.profile.profileTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-6">
                <div
                  className="relative h-36 w-36 group cursor-pointer"
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                >
                  <Avatar className="h-full w-full border-4 border-[#126319]">
                    {renderMainAvatar()}
                  </Avatar>
                  {hovered && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full"
                      onClick={image ? handleDeleteImage : handleFileInputClick}
                    >
                      {image ? (
                        <FaTrash className="text-white text-2xl" />
                      ) : (
                        <FaPlus className="text-white text-2xl" />
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageChange}
                    accept="image/*"
                    name="profile-image"
                  />
                </div>

                {/* Warning/Info Message */}
                <div className="mt-2 flex items-center space-x-2">
                  <FaExclamationTriangle className="text-yellow-500" />
                  {image ? (
                    <span className="text-yellow-500 text-sm">
                      Your custom profile picture is automatically saved.
                    </span>
                  ) : (
                    <span className="text-yellow-500 text-sm">
                      When changing your avatar, click "Save" to update your
                      profile.
                    </span>
                  )}
                </div>

                {/* Avatar Selection */}
                <div className="flex space-x-2">
                  {avatars.map((avatar, index) => (
                    <div
                      key={index}
                      className={`h-12 w-12 rounded-full cursor-pointer 
                        ${
                          selectedAvatar === index
                            ? "ring-2 ring-[#126319]"
                            : ""
                        }`}
                      onClick={() => {
                        setSelectedAvatar(index);
                      }}
                    >
                      <img
                        src={avatar}
                        alt={`avatar-${index}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Info */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <Label className="text-white text-sm mb-1 block">Email</Label>
                  <Input
                    value={user.email}
                    disabled
                    className="w-full bg-[#3b3c48] border-none text-white py-2 px-3 rounded-md"
                  />
                </div>
                <div>
                  <Label className="text-white text-sm mb-1 block">
                    Username
                  </Label>
                  <Input
                    value={username}
                    disabled
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#3b3c48] border-none text-white py-2 px-3 rounded-md"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <Button
                onClick={saveSettingsProfile}
                className="bg-[#126319] hover:bg-[#1a8f24] text-white px-6 py-2 rounded-md transition-colors"
              >
                {t("settings.profile.saveProfileSettings")}
              </Button>
            </div>
          </div>
        )}

        {activeSection === "appearance" && (
          <div className="space-y-8">
            <h2 className="text-white text-3xl font-bold">
              {t("settings.appearance.appearanceTitle")}
            </h2>

            {/* Font Size */}
            <div className="space-y-4 bg-[#1b1c24] p-4 rounded-lg shadow-lg">
              <h3 className="text-white text-lg font-semibold">
                {t("settings.appearance.fontSize.title")}
              </h3>
              <RadioGroup
                defaultValue={fontSize}
                onValueChange={setFontSize}
                className="flex gap-6"
              >
                {Object.keys(FONT_SIZES).map((size) => (
                  <div key={size} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={size}
                      id={size}
                      className="text-[#126319] border-[#126319] focus:ring-[#126319]"
                    />
                    <Label htmlFor={size} className="text-white capitalize">
                      {t("settings.appearance.fontSize." + size)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Color Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#1b1c24] p-4 rounded-lg shadow-lg space-y-4">
                <h3 className="text-white text-lg font-semibold mb-2">
                  {t("settings.appearance.sentMessagesTitle")}
                </h3>
                <div className="flex gap-2 mb-2">
                  {CHAT_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`h-12 w-12 rounded-full transition-all duration-300 
                ${
                  sentMessageColor === color
                    ? "ring-4 ring-[#126319]"
                    : "hover:ring-2 hover:ring-[#126319]"
                }
              `}
                      style={{ backgroundColor: color }}
                      onClick={() => setSentMessageColor(color)}
                    />
                  ))}
                </div>
                <div className="mt-4">
                  {" "}
                  <MessagePreview color={sentMessageColor} type="sent" />
                </div>
              </div>

              <div className="bg-[#1b1c24] p-4 rounded-lg shadow-lg space-y-4">
                <h3 className="text-white text-lg font-semibold mb-2">
                  {t("settings.appearance.receivedMessagesTitle")}
                </h3>
                <div className="flex gap-2 mb-2">
                  {CHAT_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`h-12 w-12 rounded-full transition-all duration-300 
                ${
                  receivedMessageColor === color
                    ? "ring-4 ring-[#126319]"
                    : "hover:ring-2 hover:ring-[#126319]"
                }
              `}
                      style={{ backgroundColor: color }}
                      onClick={() => setReceivedMessageColor(color)}
                    />
                  ))}
                </div>
                <div className="mt-4">
                  {" "}
                  <MessagePreview
                    color={receivedMessageColor}
                    type="received"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <Button
                onClick={saveSettings}
                className="bg-[#126319] hover:bg-[#1a8f24] text-white px-6 py-2 rounded-md transition-colors"
              >
                {t("settings.appearance.saveAppearanceSettings")}
              </Button>
            </div>
          </div>
        )}
        {activeSection === "language" && (
          <div className="space-y-8">
            <h2 className="text-white text-2xl font-semibold">
              {t("settings.language.languageTitle")}
            </h2>
            <p className="text-gray-400">
              {t("settings.language.selectLanguageDescription")}
            </p>

            <div className="space-y-4 max-w-2xl">
              <div className="bg-[#2c2e3b] rounded-lg overflow-hidden">
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                    selectedLanguage === "en"
                      ? "bg-[#126319]"
                      : "hover:bg-[#363848]"
                  }`}
                  onClick={() => setSelectedLanguage("en")}
                >
                  <div className="flex items-center space-x-3">
                    <FaGlobe className="text-white" />
                    <span className="text-white font-medium">
                      {t("settings.language.english")}
                    </span>
                  </div>
                  {selectedLanguage === "en" && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>

                <div
                  className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                    selectedLanguage === "it"
                      ? "bg-[#126319]"
                      : "hover:bg-[#363848]"
                  }`}
                  onClick={() => setSelectedLanguage("it")}
                >
                  <div className="flex items-center space-x-3">
                    <FaGlobe className="text-white" />
                    <span className="text-white font-medium">
                      {t("settings.language.italian")}
                    </span>
                  </div>
                  {selectedLanguage === "it" && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-start mt-8">
              <Button
                onClick={saveLanguageSettings}
                className="bg-[#126319] hover:bg-[#1a8f24] text-white px-6 py-2 rounded-md transition-colors"
              >
                {t("settings.language.saveLanguage")}
              </Button>
            </div>
          </div>
        )}

        {activeSection === "settings" && (
          <div className="space-y-8">
            <h2 className="text-white text-2xl font-semibold">
              {t("settings.others.othersTitle")}
            </h2>

            <div className="bg-[#2c2e3b] rounded-lg p-6 space-y-8">
              <div>
                <h3 className="text-white text-xl mb-2">
                  {t("settings.others.othersHeader")}
                </h3>
                <p className="text-gray-400">
                  {t("settings.others.othersBody")}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-[#4b5563]">
                      <th className="text-left py-3 px-4 text-white">
                        {t("settings.others.table.date")}
                      </th>
                      <th className="text-left py-3 px-4 text-white">
                        {t("settings.others.table.time")}
                      </th>
                      <th className="text-left py-3 px-4 text-white">
                        {t("settings.others.table.recency")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(1)].map((_, index) => (
                      <tr
                        key={index}
                        className="border-b border-[#4b5563] last:border-none hover:bg-[#363848] transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-300">
                          {index === 0 ? formatDate(user?.lastLogin) : "---"}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {index === 0 ? formatTime(user?.lastLogin) : "---"}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {index === 0 ? getTimeAgo(user?.lastLogin) : "---"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[#4b5563] pt-6 space-y-4">
                <p className="text-gray-300 font-medium">
                  {t("settings.others.list.liTitle")}
                </p>
                <ul className="list-disc text-gray-400 pl-5 space-y-2">
                  <li>{t("settings.others.list.li1")}</li>
                  <li>{t("settings.others.list.li2")}</li>

                  <li>{t("settings.others.list.li3")}</li>
                  <li>{t("settings.others.list.li4")}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
