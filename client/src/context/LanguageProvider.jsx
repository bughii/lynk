import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useChatStore } from "@/store/chatStore";

const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const { language } = useChatStore();

  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  return children;
};

export default LanguageProvider;
