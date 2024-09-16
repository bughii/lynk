import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Authentication from "./pages/authentication";
import Chat from "./pages/chat";
import Profile from "./pages/profile";
import { useAppStore } from "./store";
import { GET_USER_INFO } from "./utils/constants";
import { apiClient } from "./lib/api-client";

// Rende visibile il componente children (chat o profile) solo se l'utente è autenticato
const ProtectedRoute = ({ children }) => {
  // Recupero lo stato
  const { userInfo } = useAppStore();

  // !!userInfo trasforma userInfo in un boolean
  const isAuthenticaated = !!userInfo;

  // Se l'utente è autenticato, mostro children (chat o profilo)
  // Se non è autenticato, reindirizzo alla pagina di autenticazione
  return isAuthenticaated ? children : <Navigate to="/auth" />;
};

// Reindirizza l'utente autenticato a /chat
const UnauthenticatedRoute = ({ children }) => {
  const { userInfo } = useAppStore();

  const isAuthenticated = !!userInfo;

  return isAuthenticated ? <Navigate to="/chat" /> : children;
};

const App = () => {
  const { userInfo, setUserInfo } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recupero i dati dell'utente
    const getUserData = async () => {
      let response;
      try {
        // Chiamo l'endpoint per recuperare i dati dell'utente
        response = await apiClient.get(GET_USER_INFO, {
          withCredentials: true,
        });

        // Se la chiamata va a buon fine e ricevo un id
        if (response.status === 200 && response.data.id) {
          setUserInfo(response.data);
        } else {
          setUserInfo(undefined);
        }
        console.log({ response });
      } catch (error) {
        setUserInfo(undefined);
      } finally {
        setLoading(false);
      }
    };

    // se userInfo è undefined o null, chiamo getUserData
    if (!userInfo) {
      getUserData();
    } else {
      setLoading(false);
    }
  }, [userInfo, setUserInfo]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/authentication"
          element={
            <UnauthenticatedRoute>
              {" "}
              <Authentication />{" "}
            </UnauthenticatedRoute>
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
          path="/profile"
          element={
            <ProtectedRoute>
              {" "}
              <Profile />{" "}
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/authentication" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
