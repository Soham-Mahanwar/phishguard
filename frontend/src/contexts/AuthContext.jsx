import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "phishguard_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("invalid session");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          try {
            localStorage.removeItem(TOKEN_KEY);
          } catch {
            /* ignore */
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(async (email, password) => {
    const resp = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) {
      const detail = await resp.json().catch(() => ({}));
      throw new Error(detail.detail || `Login failed (${resp.status})`);
    }
    const data = await resp.json();
    try {
      localStorage.setItem(TOKEN_KEY, data.token);
    } catch {
      /* ignore */
    }
    setToken(data.token);
    setUser({ email: data.email });
    return data;
  }, []);

  const signup = useCallback(async (email, password) => {
    const resp = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) {
      const detail = await resp.json().catch(() => ({}));
      throw new Error(detail.detail || `Signup failed (${resp.status})`);
    }
    const data = await resp.json();
    try {
      localStorage.setItem(TOKEN_KEY, data.token);
    } catch {
      /* ignore */
    }
    setToken(data.token);
    setUser({ email: data.email });
    return data;
  }, []);

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
