import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import { avatars, getAvatar } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { IoArrowForward } from "react-icons/io5";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();
  const [userName, setUserName] = useState("");
  const [image, setImage] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const fileInputRef = useRef(null);

  const saveChanges = async () => {};

  const handleButton = () => {};

  const handleFileInputClick = () => {};

  const handleImageChange = async () => {};

  const handleDeleteImage = async () => {};

  return (
    <div className="bg-[#1b1c24] h-[100vh] flex items-center justify-center flex-col gap-8 p-6">
      <div className="relative w-full md:w-2/3 lg:w-1/3 bg-[#2c2e3b] p-8 rounded-lg shadow-lg">
        {/* Close Button */}
        <div className="absolute top-4 right-4" onClick={handleButton}>
          <IoArrowForward className="text-4xl lg:text-6xl text-white text-opacity-90 cursor-pointer" />
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-6">
          <div
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
                  src={getAvatar(selectedColor)} // Mostra l'avatar in base al colore selezionato
                  alt="avatar"
                  className="object-cover w-full h-full"
                />
              )}
            </Avatar>

            {hovered && (
              <div
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
            />
          </div>

          {/* Input Section */}
          <div className="w-full flex flex-col gap-4">
            <Input
              placeholder="Email"
              type="email"
              disabled
              value={userInfo.email}
              className="rounded-lg p-4 bg-[#3b3c48] border-none text-white"
            />
            <Input
              placeholder="Username"
              type="text"
              onChange={(e) => setUserName(e.target.value)}
              value={userName}
              className="rounded-lg p-4 bg-[#3b3c48] border-none text-white"
            />
          </div>

          {/* Color Selection */}
          <div className="flex gap-4 mt-4">
            {avatars.map((avatar, index) => (
              <div
                key={index}
                className={`relative h-12 w-12 rounded-full cursor-pointer transition-all duration-300 ${
                  selectedColor === index
                    ? "outline outline-white/50 outline-2"
                    : ""
                }`}
                onClick={() => setSelectedColor(index)}
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

        {/* Save Button */}
        <div className="mt-6">
          <Button
            className="h-12 w-full bg-blue-700 hover:bg-blue-900 transition-all duration-300"
            onClick={saveChanges}
          >
            Salva
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
