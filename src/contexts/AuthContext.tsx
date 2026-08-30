"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppUser, UserRole } from "@/types";
import { store } from "@/lib/store";
import {
  getFirebaseAuth,
  getSecondaryAuth,
  isFirebaseConfigured,
} from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile,
} from "firebase/auth";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  isDemoMode: false;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    displayName: string;
    role?: UserRole;
  }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<AppUser>) => Promise<void>;
  /** Admin: สร้างบัญชีใหม่โดยไม่สลับ session */
  createUserAsAdmin: (data: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
    department?: string;
    phone?: string;
  }) => Promise<AppUser>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapFirebaseError(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: string }).code)
      : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "auth/email-already-in-use":
      return "อีเมลนี้ถูกใช้งานแล้ว";
    case "auth/weak-password":
      return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    case "auth/invalid-email":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "auth/too-many-requests":
      return "พยายามหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง";
    case "auth/configuration-not-found":
      return "ยังไม่ได้เปิด Email/Password ใน Firebase Authentication";
    default:
      if (!isFirebaseConfigured) {
        return "ยังไม่ได้ตั้งค่า Firebase (.env.local)";
      }
      return err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const profile = await store.getUser(uid);
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      setUser(null);
      return;
    }

    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          let profile = await store.getUser(fbUser.uid);
          if (!profile) {
            // สร้างโปรไฟล์เริ่มต้นถ้ามี Auth แต่ยังไม่มีใน Firestore
            profile = {
              id: fbUser.uid,
              email: fbUser.email ?? "",
              displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
              role: "participant",
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              isActive: true,
            };
            await store.upsertUser(profile);
          } else if (!profile.isActive) {
            await signOut(auth);
            setUser(null);
            setLoading(false);
            return;
          } else {
            await store.upsertUser({
              ...profile,
              lastLoginAt: new Date().toISOString(),
            });
          }
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error(e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const refreshUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      await loadProfile(auth.currentUser.uid);
    }
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password
      );
      const profile = await store.getUser(cred.user.uid);
      if (profile && !profile.isActive) {
        await signOut(getFirebaseAuth());
        throw new Error("บัญชีนี้ถูกระงับการใช้งาน");
      }
    } catch (err) {
      throw new Error(mapFirebaseError(err));
    }
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      displayName: string;
    }) => {
      try {
        if (data.password.length < 6) {
          throw new Error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
        }
        const cred = await createUserWithEmailAndPassword(
          getFirebaseAuth(),
          data.email.trim(),
          data.password
        );
        await updateAuthProfile(cred.user, { displayName: data.displayName });
        const newUser: AppUser = {
          id: cred.user.uid,
          email: data.email.trim().toLowerCase(),
          displayName: data.displayName,
          role: "participant",
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          isActive: true,
        };
        await store.upsertUser(newUser);
        setUser(newUser);
      } catch (err) {
        throw new Error(mapFirebaseError(err));
      }
    },
    []
  );

  const createUserAsAdmin = useCallback(
    async (data: {
      email: string;
      password: string;
      displayName: string;
      role: UserRole;
      department?: string;
      phone?: string;
    }) => {
      try {
        const secondary = getSecondaryAuth();
        const cred = await createUserWithEmailAndPassword(
          secondary,
          data.email.trim(),
          data.password
        );
        const newUser: AppUser = {
          id: cred.user.uid,
          email: data.email.trim().toLowerCase(),
          displayName: data.displayName,
          role: data.role,
          department: data.department,
          phone: data.phone,
          createdAt: new Date().toISOString(),
          isActive: true,
        };
        await store.upsertUser(newUser);
        await signOut(secondary);
        return newUser;
      } catch (err) {
        throw new Error(mapFirebaseError(err));
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth());
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
    } catch (err) {
      throw new Error(mapFirebaseError(err));
    }
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<AppUser>) => {
      if (!user) return;
      const updated = { ...user, ...data, id: user.id };
      await store.upsertUser(updated);
      setUser(updated);
      const auth = getFirebaseAuth();
      if (auth.currentUser && data.displayName) {
        await updateAuthProfile(auth.currentUser, {
          displayName: data.displayName,
        });
      }
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isDemoMode: false as const,
      login,
      register,
      logout,
      resetPassword,
      updateProfile,
      createUserAsAdmin,
      refreshUser,
    }),
    [
      user,
      loading,
      login,
      register,
      logout,
      resetPassword,
      updateProfile,
      createUserAsAdmin,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
