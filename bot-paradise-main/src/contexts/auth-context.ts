import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "admin" | "user";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  roles: Role[];
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
