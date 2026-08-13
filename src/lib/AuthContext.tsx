import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  user: any;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signInWithGoogle: async () => {},
  logout: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState({ email: "user@dev6.os", displayName: "Investigator" });
  const signInWithGoogle = async () => {};
  const logout = async () => {};
  return (
    <AuthContext.Provider value={{ user, loading: false, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
