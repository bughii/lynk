import { create } from "zustand";
import { createAuthSlice } from "./authStore";

// Creo uno store globale
// Gli passo come argoment
export const useAppStore = create()((...a) => ({
  ...createAuthSlice(...a),
}));
