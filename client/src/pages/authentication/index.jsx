import React from "react";
import { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/Tabs";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const Authentication = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = () => {};

  const handleSignup = () => {};

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#1b1c24]">
      <div className="w-full max-w-5xl bg-[#2c2e3b] shadow-2xl rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col items-center justify-center bg-[#1b1c24] text-white p-12">
            <h1>Benvenuto</h1>
            <p>Inserisci i tuoi dati</p>
          </div>
          <div className="flex flex-col items-center justify-center p-12 bg-[#2c2e3b]">
            <Tabs className="w-full" defaultValue="login">
              <TabsList className="flex w-full bg-[#2c2e3b] rounded-xl mb-6 shadow-sm">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-transparent text-white text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-white data-[state=active]:border-b-blue-400 p-3 transition-all duration-300"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-transparent text-white text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-white data-[state=active]:border-b-blue-400 p-3 transition-all duration-300"
                >
                  Registrati
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
                    Accedi
                  </Button>
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
                    placeholder="Password"
                    type="password"
                    className="p-4 rounded-lg border border-[#4b5563] bg-[#2c2e3b] text-white focus:ring-2 focus:ring-[#4b5563]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Input
                    placeholder="Conferma Password"
                    type="password"
                    className="p-4 rounded-lg border border-[#4b5563] bg-[#2c2e3b] text-white focus:ring-2 focus:ring-[#4b5563]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button
                    className="p-4 bg-[#4b5563] text-white rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
                    onClick={handleSignup}
                  >
                    Registrati
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
