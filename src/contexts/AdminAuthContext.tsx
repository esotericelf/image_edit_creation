import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminLogout, checkAdminSession } from "../components/NanoBananaEditor/api";

interface AdminAuthContextValue {
  isAdmin: boolean;
  loading: boolean;
  refreshAdminSession: () => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAdminSession = useCallback(async () => {
    const authenticated = await checkAdminSession();
    setIsAdmin(authenticated);
    return authenticated;
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
      refreshAdminSession,
      logoutAdmin,
    }),
    [isAdmin, loading, refreshAdminSession, logoutAdmin],
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
