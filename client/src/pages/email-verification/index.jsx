import { useState, useRef } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const EmailVerificationPage = () => {
  // Six empty strings represent the six input fields
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  // Reference to each input field
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { verifyEmail } = useAuthStore();

  const handleChange = (index, value) => {
    const newCode = [...code];

    // Handle pasted content
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedCode[i] || "";
      }
      setCode(newCode);

      // Focus on the last non-empty input or the first empty one
      const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
      const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
      inputRefs.current[focusIndex].focus();
    } else {
      newCode[index] = value;
      setCode(newCode);

      // Move focus to the next input field if value is entered
      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join("");
    console.log("Verification code sent: ", verificationCode);
    try {
      const response = await verifyEmail(verificationCode);
      if (response.success) {
        navigate("/profile");
        toast.success(t("emailVerification.verifySuccess"));
      }
    } catch (error) {
      console.log(error);
      toast.error(t("emailVerification.verifyError"));
    }
  };

  // Auto submit when all fields are filled
  useEffect(() => {
    if (code.every((digit) => digit !== "")) {
      handleSubmit(new Event("submit"));
    }
  }, [code]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#1b1c24]">
      <div className="w-full max-w-5xl bg-[#2c2e3b] shadow-2xl rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col items-center justify-center bg-[#1b1c24] text-white p-12">
            <h1 className="text-3xl font-bold mb-6 text-center text-white">
              {t("emailVerification.title")}
            </h1>
            <p className="text-center text-gray-300 mb-6">
              {t("emailVerification.description")}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center p-12 bg-[#2c2e3b]">
            <form onSubmit={handleSubmit} className="space-y-6 w-full">
              <div className="flex justify-between">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="6"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-2xl font-bold bg-[#1b1c24] text-white border border-[#4b5563] rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={code.some((digit) => !digit)}
                className="w-full bg-[#4b5563] text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 disabled:opacity-50"
              >
                {t("emailVerification.button")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
