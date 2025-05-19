import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Chat from "./pages/chat";
import Profile from "./pages/profile";
import { useAuthStore } from "./store/authStore";
import Authentication from "./pages/authentication";
import EmailVerificationPage from "./pages/email-verification";
import ForgotPasswordPage from "./pages/forgot-password";
import ResetPasswordPage from "./pages/reset-password";
import Settings from "./pages/chat/contacts-list/components/profile-settings";
import LanguageProvider from "./context/LanguageProvider";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!user?.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user?.isVerified) {
    return <Navigate to="/chat" replace />;
  }

  return children;
};

const App = () => {
  // Recupero lo stato con zustand
  const { isCheckingAuth, checkAuth, user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <LanguageProvider>
        <Routes>
          <Route
            path="/auth"
            element={
              <RedirectAuthenticatedUser>
                <Authentication />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                {" "}
                <Chat />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                {" "}
                <Settings />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                {" "}
                <Profile />{" "}
              </ProtectedRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <RedirectAuthenticatedUser>
                <ForgotPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <RedirectAuthenticatedUser>
                <ResetPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />

          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
