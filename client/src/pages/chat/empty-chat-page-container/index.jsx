import { useTranslation } from "react-i18next";

function EmptyChatContainer() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 md:bg-[#1c1d25] md:flex flex-col justify-start items-center hidden duration-1000 transition-all">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="text-opacity-80 text-white flex flex-col gap-5 items-center mt-10 lg:text-4xl text-3xl transition-all duration-3000">
          <h3 className="space-mono-regular">
            {t("mainpage.welcomeMessageEmptyScreen")}
            <span className="text-green-500">! </span>
            {t("mainpage.welcomeMessageEmptyScreen1")}
            <span className="text-green-500"> Lynk</span>.
          </h3>
        </div>
      </div>
    </div>
  );
}

export default EmptyChatContainer;
