import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  clearToken,
  getStoredToken,
  forgotPasswordRequest,
  loginRequest,
  meRequest,
  resetPasswordRequest,
  signupRequest,
  storeToken,
  updateProfileRequest,
} from "../api";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (email: string, password: string) => Promise<void>;
  updateProfile: (data: {
    name: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    avatarUrl: string;
  }) => Promise<void>;
  applyUser: (nextUser: User) => void;
  saveAvatar: (avatarUrl: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    meRequest()
      .then(function (nextUser) {
        setUser(nextUser);
      })
      .catch(function (error: Error) {
        if (error.message === "unauthorized") {
          clearToken();
          setToken(null);
          setUser(null);
        }
      })
      .finally(function () {
        setLoading(false);
      });
  }, [token]);

  async function login(email: string, password: string) {
    const result = await loginRequest(email, password);
    storeToken(result.token);
    setToken(result.token);
    setUser(result.user);
  }

  async function signup(name: string, email: string, password: string) {
    const result = await signupRequest(name, email, password);
    storeToken(result.token);
    setToken(result.token);
    setUser(result.user);
  }

  async function requestPasswordReset(email: string) {
    const result = await forgotPasswordRequest(email);
    return result.email;
  }

  async function resetPassword(email: string, password: string) {
    await resetPasswordRequest(email, password);
  }

  async function updateProfile(data: {
    name: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    avatarUrl: string;
  }) {
    const nextUser = await updateProfileRequest(data);
    setUser(nextUser);
  }

  function applyUser(nextUser: User) {
    setUser(function (current) {
      if (!current || current.id !== nextUser.id) {
        return current;
      }
      return nextUser;
    });
  }

  async function saveAvatar(avatarUrl: string) {
    if (!user) {
      return;
    }
    setUser({ ...user, avatarUrl });
    const nextUser = await updateProfileRequest({
      name: user.name,
      email: user.email,
      currentPassword: "",
      newPassword: "",
      avatarUrl,
    });
    setUser(nextUser);
  }

  function logout() {
    clearToken();
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    applyUser,
    saveAvatar,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
