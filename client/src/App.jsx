import React from "react";
import { Button } from "@/components/ui/button";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Authentication from "./pages/authentication";
import Chat from "./pages/chat";
import Profile from "./pages/profile";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/authentication" element={<Authentication />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/authentication" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
