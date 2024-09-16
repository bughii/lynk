// Slice per gestire autenticazione
// Restituisce uno stato
export const createAuthSlice = (set) => ({
  userInfo: undefined,
  setUserInfo: (userInfo) => set({ userInfo }),
});
