import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await forgotPassword(email);
    setIsSubmitted(true);
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
              Se esiste un account con la mail <strong>{email}</strong>,
              riceverai una mail con un link per il reset.
            </p>
          ) : (
            <>
              <p className="text-center text-gray-300 mb-6">
                Inserisci la tua email e ti invieremo un link per reimpostare la
                password.
              </p>

              <Input
                type="email"
                placeholder="Inserisci la tua email"
                className="p-4 rounded-lg border border-[#4b5563] bg-[#2c2e3b] text-white focus:ring-2 focus:ring-[#4b5563] mb-6"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="p-4 bg-[#4b5563] text-white rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
                onClick={handleSubmit}
              >
                Invia link per reimpostare
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
