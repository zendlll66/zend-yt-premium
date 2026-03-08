import { create } from "zustand";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "cashier";
};

type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
