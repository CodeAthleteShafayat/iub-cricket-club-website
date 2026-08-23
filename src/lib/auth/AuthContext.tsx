"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { Member } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  member: Member | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  member: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [memberLoading, setMemberLoading] = useState(true);

  useEffect(() => {
    let unsubMember: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (nextUser) => {
      unsubMember?.();
      setUser(nextUser);
      setAuthLoading(false);

      if (!nextUser) {
        setMember(null);
        setMemberLoading(false);
        return;
      }

      setMemberLoading(true);
      unsubMember = onSnapshot(doc(db, "members", nextUser.uid), (snap) => {
        setMember(snap.exists() ? (snap.data() as Member) : null);
        setMemberLoading(false);
      });
    });

    return () => {
      unsubAuth();
      unsubMember?.();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, member, loading: authLoading || memberLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
