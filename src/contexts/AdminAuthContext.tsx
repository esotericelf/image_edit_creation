import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  adminLogin,
  adminLogout,
  checkAdminSession,
} from "../components/NanoBananaEditor/api";

interface AdminAuthContextValue {
  isAdmin: boolean;
  loading: boolean;
  loginAdmin: (password: string) => Promise<boolean>;
  refreshAdminSession: () => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const SESSION_VERIFY_ERROR =
  "Sign-in succeeded but your session cookie was not established. " +
  "On production, ensure the API sets Secure + SameSite=None cookies and allows your Netlify origin in CORS.";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAdminSession = useCallback(async () => {
    const authenticated = await checkAdminSession();
    setIsAdmin(authenticated);
    return authenticated;
  }, []);

  const loginAdmin = useCallback(async (password: string) => {
    await adminLogin(password);
    const authenticated = await checkAdminSession();
    setIsAdmin(authenticated);
    if (!authenticated) {
      throw new Error(SESSION_VERIFY_ERROR);
    }
    return true;
  }, []);

  const logoutAdmin = useCallback(async () => {
    await adminLogout();
    setIsAdmin(false);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refreshAdminSession();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshAdminSession]);

  const value = useMemo(
    () => ({
      isAdmin,
      loading,
      loginAdmin,
      refreshAdminSession,
      logoutAdmin,
    }),
    [isAdmin, loading, loginAdmin, refreshAdminSession, logoutAdmin],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
