import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { avatars, getAvatar } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IoArrowForward } from "react-icons/io5";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { HOST } from "@/utils/constants";
import { useTranslation } from "react-i18next";

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, updateProfileImage, removeProfileImage } =
    useAuthStore();
  const [image, setImage] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    console.log("Is the user verified?", user.isVerified);
    if (user) {
      setSelectedAvatar(user.avatar || 0);
      if (user.image) {
        setImage(`${HOST}/${user.image}`);
      }
    }
  }, [user]);

  const saveChanges = async () => {
    try {
      const response = await updateProfile(selectedAvatar);
      console.log("Response after updating profile: ", response);
      if (response && response.status === 200) {
        toast.success(t("profileSetup.updateSuccess"));
        navigate("/chat");
      }
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast.error(t("profileSetup.updateError"));
    }
  };

  const handleButton = () => {
    if (user.profileSetup) {
      navigate("/chat");
    } else {
      toast.error(t("profileSetup.errorSetup"));
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

        // Make sure the response is successful and has an image
        if (response?.status === 200 && response.data?.image) {
          toast.success(t("profileSetup.imageUpdateSuccess"));
        }
        const reader = new FileReader();
        reader.onload = () => {
          setImage(reader.result);
        };
      } catch (error) {
        toast.error(t("profileSetup.imageUpdateError"));
        console.error(error);
      }
    }
  };

  const handleDeleteImage = async () => {
    try {
      const response = await removeProfileImage();
      console.log("Response after image removal: ", response);
      if (response.status === 200) {
        setImage(null);
        toast.success(t("profileSetup.imageDeleteSuccess"));
      }
    } catch (error) {
      toast.error(t("profileSetup.imageDeleteError"));
      console.log({ error });
    }
  };

  return (
    <div className="bg-[#1b1c24] h-[100vh] flex items-center justify-center flex-col gap-8 p-6">
      <div className="relative w-full md:w-2/3 lg:w-1/3 bg-[#2c2e3b] p-8 rounded-lg shadow-lg">
        <div className="absolute top-4 right-4" onClick={handleButton}>
          <IoArrowForward className="text-4xl lg:text-6xl text-white text-opacity-90 cursor-pointer" />
        </div>

        <div className="flex flex-col items-center gap-6">
          <div
            data-testid="profile-avatar-container"
            className="relative h-32 w-32 md:w-48 md:h-48 flex items-center justify-center"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <Avatar className="h-32 w-32 md:w-48 md:h-48 rounded-full overflow-hidden">
              {image ? (
                <AvatarImage
                  src={image}
                  alt="profile-image"
                  className="object-cover w-full h-full bg-black"
                />
              ) : (
                <AvatarImage
                  src={getAvatar(selectedAvatar)}
                  alt="avatar"
                  className="object-cover w-full h-full"
                />
              )}
            </Avatar>

            {hovered && (
              <div
                data-testid="avatar-action-button"
                className="absolute inset-0 flex items-center justify-center bg-black/50 ring-fuchsia-50 rounded-full"
                onClick={image ? handleDeleteImage : handleFileInputClick}
              >
                {image ? (
                  <FaTrash className="text-white text-3xl cursor-pointer" />
                ) : (
                  <FaPlus className="text-white text-3xl cursor-pointer" />
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageChange}
              name="profile-image"
              accept=".png, .jpg, .jpeg, .svg, .webp"
              data-testid="file-input"
            />
          </div>

          <div className="w-full flex flex-col gap-4">
            <Input
              placeholder="Email"
              type="email"
              disabled
              value={user.email}
              className="rounded-lg p-4 bg-[#3b3c48] border-none text-white"
            />
            <Input
              placeholder="Username"
              type="text"
              disabled
              value={user.userName}
              className="rounded-lg p-4 bg-[#3b3c48] border-none text-white"
            />
          </div>
          <div className="flex gap-4 mt-4">
            {avatars.map((avatar, index) => (
              <div
                key={index}
                className={`relative h-12 w-12 rounded-full cursor-pointer transition-all duration-300 ${
                  selectedAvatar === index
                    ? "outline outline-white/50 outline-2"
                    : ""
                }`}
                onClick={() => setSelectedAvatar(index)}
              >
                <img
                  src={avatar}
                  alt={`avatar-${index}`}
                  className="object-cover w-full h-full rounded-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Button
            className="h-12 w-full bg-blue-700 hover:bg-blue-900 transition-all duration-300"
            onClick={saveChanges}
          >
            {t("profileSetup.save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
