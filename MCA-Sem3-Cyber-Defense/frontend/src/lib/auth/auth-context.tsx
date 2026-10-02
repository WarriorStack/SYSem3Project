import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/lib/api/services";
import { getToken, parseApiError, setToken, setUnauthorizedHandler } from "@/lib/api/client";
import type { AuthTokenResponse, User } from "@/lib/api/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<AuthTokenResponse | User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  const loadSession = useCallback(async () => {
    const existing = getToken();
    setTokenState(existing);
    if (!existing) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await authService.me();
      setUser(me);
    } catch (error) {
      const parsed = parseApiError(error);
      // Only drop the session for real auth failures — keep it if the API is down.
      if (parsed.status === 401 || parsed.status === 403) clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      if (typeof window !== "undefined") {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${next}`;
      }
    });
    void loadSession();
    return () => setUnauthorizedHandler(null);
  }, [clearSession, loadSession]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password);
    if (!data?.access_token) throw new Error("The login response did not include a token.");
    setToken(data.access_token);
    setTokenState(data.access_token);
    if (data.user) {
      setUser(data.user);
    } else {
      setUser(await authService.me());
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    return authService.register(name, email, password);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* session teardown proceeds regardless of backend availability */
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthState>(() => {
    const role = (user?.role as string | undefined) ?? null;
    return {
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      role,
      isAdmin: role === "admin",
      login,
      register,
      logout,
      refresh: loadSession,
    };
  }, [user, token, isLoading, login, register, logout, loadSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
