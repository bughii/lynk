import React from "react";
import { useState } from "react";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import thumbs from "@/assets/thumbsup.png";

import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Authentication = () => {
  const { signup, login } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Function to validate the login form
  const validateLogin = () => {
    // If the email field is empty
    if (!email.length) {
      toast.error(t("auth.errors.emailRequired"));
      return false;
    }
    // If the password field is empty
    if (!password.length) {
      toast.error(t("auth.errors.passwordRequired"));
      return false;
    }
    // Otherwise, return true
    return true;
  };

  // Function to validate the signup form
  const validateSignup = () => {
    if (!email.length) {
      toast.error(t("auth.errors.emailRequired"));
      return false;
    }
    if (!userName.length) {
      toast.error(t("auth.errors.usernameRequired"));
      return false;
    }
    if (!password.length) {
      toast.error(t("auth.errors.passwordRequired"));
      return false;
    }
    if (password !== confirmPassword) {
      toast.error(t("auth.errors.passwordMismatch"));
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    try {
      const response = await login(email, password);
      if (response.success) {
        const { user } = useAuthStore.getState();
        if (user) {
          navigate(user.profileSetup ? "/chat" : "/profile");
        }
      }
    } catch (error) {
      console.error(t("auth.errors.loginError"));
      toast.error(error.message || t("auth.errors.loginError"));
    }
  };

  const handleSignup = async () => {
    if (validateSignup()) {
      try {
        const response = await signup(email, password, userName);
        navigate("/verify-email");
      } catch (error) {
        if (error.errorType) {
          switch (error.errorType) {
            case "email_in_use":
              toast.error(t("auth.errors.emailInUse"));
              break;
            case "username_in_use":
              toast.error(t("auth.errors.usernameInUse"));
              break;
            default:
              toast.error(t("auth.errors.registrationError"));
          }
        } else {
          toast.error(error.message || t("auth.errors.registrationError"));
        }
      }
    }
  };

  return (
    <div className="space-mono-regular h-screen w-screen flex items-center justify-center bg-[#1b1c24]">
      <div className="w-full max-w-screen-md lg:max-w-5xl mx-auto bg-[#2c2e3b] shadow-2xl rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col items-center justify-center bg-[#1b1c24] text-white p-12">
            <h1>
              {t("auth.signup")}
              <span className="text-green-500">!</span>
            </h1>
            <p>
              {t("auth.enterCredentials")}
              <span className="text-green-500">.</span>
            </p>
            <img src={thumbs} alt="Login" className="w-32 h-32 mt-10" />
          </div>
          <div className="flex flex-col items-center justify-center p-12 bg-[#2c2e3b]">
            <Tabs className="w-full" defaultValue="login">
              <TabsList className="flex w-full bg-[#2c2e3b] rounded-xl mb-6 shadow-sm">
                <TabsTrigger
                  role="tab"
                  value="login"
                  aria-label="Login tab"
                  className="data-[state=active]:bg-transparent text-white text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-white data-[state=active]:border-b-blue-400 p-3 transition-all duration-300"
                >
                  {t("auth.login")}
                </TabsTrigger>
                <TabsTrigger
                  role="tab"
                  value="signup"
                  aria-label="Signup tab"
                  className="data-[state=active]:bg-transparent text-white text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-white data-[state=active]:border-b-blue-400 p-3 transition-all duration-300"
                >
                  {t("auth.signup")}
                </TabsTrigger>
              </TabsList>
              <div className="min-h-[250px] flex flex-col justify-center">
                <TabsContent
                  className="w-full flex flex-col gap-7"
                  value="login"
                >
                  <Input
                    placeholder="Email"
                    type="email"
                    className="p-4 rounded-lg border border-[#4b5563] bg-[#2c2e3b] text-white focus:ring-2 focus:ring-[#4b5563]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    className="p-4 rounded-lg border border-[#4b5563] bg-[#2c2e3b] text-white focus:ring-2 focus:ring-[#4b5563]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    className="p-4 bg-[#4b5563] text-white rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
                    onClick={handleLogin}
                  >
                    {t("auth.login")}
                  </Button>
                  <div className="text-left">
                    <Link
                      to="/forgot-password"
                      className="text-blue-400 hover:text-blue-500 transition-colors"
                    >
                      {t("auth.forgotPassword")}
                    </Link>
                  </div>
                </TabsContent>
                <TabsContent
                  className="w-full flex flex-col gap-7"
                  value="signup"
                >
                  <Input
                    placeholder="Email"
                    type="email"
                    className="p-4 rounded-lg border border-[#4b5563] bg-[#2c2e3b] text-white focus:ring-2 focus:ring-[#4b5563]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Username"
                    type="text"
                    className="p-4 rounded-lg border border-[#4b5563] bg-[#2c2e3b] text-white focus:ring-2 focus:ring-[#4b5563]"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    type="password"
                    className="p-4 rounded-lg border border-[#4b5563] bg-[#2c2e3b] text-white focus:ring-2 focus:ring-[#4b5563]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Input
                    placeholder={t("auth.confirmPassword")}
                    type="password"
                    className="p-4 rounded-lg border border-[#4b5563] bg-[#2c2e3b] text-white focus:ring-2 focus:ring-[#4b5563]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button
                    className="p-4 bg-[#4b5563] text-white rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
                    onClick={handleSignup}
                  >
                    {t("auth.signup")}
                  </Button>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Authentication;
