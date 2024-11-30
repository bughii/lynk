import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const { forgotPassword } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await forgotPassword(email);
    setIsSubmitted(true);
  };

  const handleEmailChange = (e) => {
    const emailValue = e.target.value;
    setEmail(emailValue);

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    setIsEmailValid(emailRegex.test(emailValue));
  };

  const handleButton = () => {
    navigate("/auth");
  };

  return (
    <div className="space-mono-regular h-screen w-screen flex items-center justify-center bg-[#1b1c24]">
      <div className="relative w-full max-w-lg bg-[#2c2e3b] shadow-2xl rounded-3xl overflow-hidden">
        <div
          className="absolute top-4 left-4"
          onClick={handleButton}
          data-testid="navigate-back"
        >
          <IoArrowBack
            role="button"
            name="back-button"
            className="text-4xl lg:text-5xl text-white text-opacity-90 cursor-pointer"
          />
        </div>
        <div className="flex flex-col items-center justify-center bg-[#1b1c24] text-white p-12">
          <h1 className="text-3xl font-bold mb-6 text-center text-white">
            {t("forgotPassword.title")}
          </h1>
          {isSubmitted ? (
            <p className="text-center text-gray-300 mb-6">
              {t("forgotPassword.resetText")}
            </p>
          ) : (
            <>
              <p className="text-center text-gray-300 mb-6">
                {t("forgotPassword.text")}
              </p>

              <Input
                type="email"
                placeholder={t("forgotPassword.enterEmailPlaceholder")}
                className="p-4 rounded-lg border border-[#4b5563] bg-[#2c2e3b] text-white focus:ring-2 focus:ring-[#4b5563] mb-6"
                value={email}
                onChange={handleEmailChange}
                required
              />
              <Button
                type="submit"
                className="p-4 bg-[#4b5563] text-white rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
                onClick={handleSubmit}
                disabled={!isEmailValid}
              >
                {t("forgotPassword.sendLink")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
