import React, { createContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

interface AuthContextType {
  userToken: string | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (token: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  userToken: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signIn = async (token: string) => {
    await SecureStore.setItemAsync("userToken", token);
    setUserToken(token);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("userToken");
    setUserToken(null);
  };

  const signUp = async (token: string) => {
    await SecureStore.setItemAsync("userToken", token);
    setUserToken(token);
  };

  const loadToken = async () => {
    const storedToken = await SecureStore.getItemAsync("userToken");
    if (storedToken) setUserToken(storedToken);
    setIsLoading(false);
  };

  useEffect(() => {
    loadToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{ userToken, isLoading, signIn, signOut, signUp }}
    >
      {children}
    </AuthContext.Provider>
  );
};
