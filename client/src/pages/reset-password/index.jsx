import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuthStore();
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Le password non corrispondono");
      return;
    }
    try {
      await resetPassword(token, newPassword);
      toast.success("Password reimpostata con successo");
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error("Errore durante il reset della password");
    }
  };
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#1b1c24]">
      <div className="w-full max-w-lg bg-[#2c2e3b] shadow-2xl rounded-3xl overflow-hidden">
        <div className="flex flex-col items-center justify-center bg-[#1b1c24] text-white p-12">
          <h1 className="text-3xl font-bold mb-6 text-center text-white">
            Reimposta Password
          </h1>
          {isSubmitted ? (
            // Mostra questo messaggio dopo l'invio
            <p className="text-center text-gray-300 mb-6">
              La tua password è stata reimpostata con successo.
            </p>
          ) : (
            <>
              <Input
                type="password"
                placeholder="Nuova Password"
                className="p-4 rounded-lg border border-[#4b5563] bg-[#2c2e3b] text-white focus:ring-2 focus:ring-[#4b5563] mb-6"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Conferma Password"
                className="p-4 rounded-lg border border-[#4b5563] bg-[#2c2e3b] text-white focus:ring-2 focus:ring-[#4b5563] mb-6"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="p-4 bg-[#4b5563] text-white rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
                onClick={handleSubmit}
              >
                Reimposta Password
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
