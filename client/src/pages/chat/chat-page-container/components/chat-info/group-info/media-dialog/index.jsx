import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/lib/api-client";
import { HOST } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FaFileImage,
  FaFilePdf,
  FaFileAlt,
  FaFileAudio,
  FaFileVideo,
  FaFileArchive,
  FaDownload,
} from "react-icons/fa";

function GroupMediaDialog({ open, onOpenChange, groupId }) {
  const { t } = useTranslation();
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchGroupMedia = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(
          `/api/groups/get-group-media/${groupId}`
        );
        console.log("Media response:", response.data);
        if (response.data && response.data.files) {
          setMediaFiles(response.data.files);
        } else {
          setMediaFiles([]);
        }
      } catch (error) {
        console.error("Error fetching group media:", error);
        setMediaFiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (open && groupId) {
      fetchGroupMedia();
    }
  }, [open, groupId]);

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/"))
      return <FaFileImage className="text-blue-400" size={24} />;
    if (fileType.startsWith("video/"))
      return <FaFileVideo className="text-red-400" size={24} />;
    if (fileType.startsWith("audio/"))
      return <FaFileAudio className="text-green-400" size={24} />;
    if (fileType === "application/pdf")
      return <FaFilePdf className="text-red-500" size={24} />;
    if (fileType.includes("archive") || fileType.includes("zip"))
      return <FaFileArchive className="text-yellow-500" size={24} />;
    return <FaFileAlt className="text-gray-400" size={24} />;
  };

  const isImageFile = (fileType) => {
    return fileType.startsWith("image/");
  };

  const downloadFile = async (fileUrl) => {
    try {
      const response = await apiClient.get(`${HOST}/${fileUrl}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileUrl.split("/").pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1b1c24] border-[#2c2e3b] text-white max-w-2xl w-full max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center text-xl">
            {t("groupInfo.sharedMedia")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8 text-gray-400">
            {t("common.loading")}...
          </div>
        ) : mediaFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <FaFileImage size={48} className="mb-4 opacity-50" />
            <p>{t("groupInfo.noMediaShared")}</p>
          </div>
        ) : (
          <ScrollArea className="flex-grow overflow-auto my-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
              {mediaFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative group bg-[#2c2e3b] rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-[#363848] transition-colors"
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="w-full aspect-square flex items-center justify-center mb-2 overflow-hidden rounded-md">
                    {isImageFile(file.fileType) ? (
                      <img
                        src={`${HOST}/${file.fileURL}`}
                        alt={file.fileName}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        {getFileIcon(file.fileType)}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs truncate w-full">
                      {file.fileName.length > 15
                        ? file.fileName.substring(0, 12) + "..."
                        : file.fileName}
                    </p>
                    <span className="text-xs text-gray-400">
                      {new Date(file.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                    <Button
                      size="sm"
                      className="bg-[#126319] hover:bg-[#1a8f24]"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file.fileURL);
                      }}
                    >
                      <FaDownload className="mr-2" />
                      {t("common.download")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex-shrink-0 mt-auto pt-2 border-t border-[#2c2e3b]">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[#2c2e3b] hover:bg-[#363848] text-white"
          >
            {t("common.close")}
          </Button>
        </DialogFooter>

        {selectedFile && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setSelectedFile(null)}
          >
            <div
              className="relative max-w-3xl max-h-[80vh] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {isImageFile(selectedFile.fileType) ? (
                <img
                  src={`${HOST}/${selectedFile.fileURL}`}
                  alt={selectedFile.fileName}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              ) : (
                <div className="bg-[#2c2e3b] rounded-lg p-8 flex flex-col items-center">
                  {getFileIcon(selectedFile.fileType)}
                  <p className="mt-4 mb-2">{selectedFile.fileName}</p>
                  <Button
                    onClick={() => downloadFile(selectedFile.fileURL)}
                    className="bg-[#126319] hover:bg-[#1a8f24] mt-4"
                  >
                    <FaDownload className="mr-2" />
                    {t("common.download")}
                  </Button>
                </div>
              )}
              <button
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                onClick={() => setSelectedFile(null)}
              >
                ✖
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default GroupMediaDialog;
