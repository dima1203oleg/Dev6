import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  user: any;
  loading: boolean;
  token: string;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  token: '',
  signInWithGoogle: async () => {},
  logout: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState({ 
    email: "admin@predator.gov.ua", 
    displayName: "Administrator",
    role: "ADMIN"
  });
  const [token, setToken] = useState('prod-test-token-123456789012345678901234567890');
  
  // Store token in localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    } else {
      localStorage.setItem('authToken', 'prod-test-token-123456789012345678901234567890');
    }
  }, []);
  
  const signInWithGoogle = async () => {};
  const logout = async () => {
    localStorage.removeItem('authToken');
    setToken('');
  };
  
  return (
    <AuthContext.Provider value={{ user, loading: false, token, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
