import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  user: any;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: false });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState({ email: "user@dev6.os", displayName: "Investigator" });
  return <AuthContext.Provider value={{ user, loading: false }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
