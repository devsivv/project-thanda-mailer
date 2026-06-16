// useAuth.js — separate file to satisfy Vite fast-refresh rule.
// AuthContext.jsx may only export components; hooks/functions go here.
import { useContext } from "react";
import { AuthContext } from "./AuthContext.js";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth() must be called inside <AuthProvider>.");
  }
  return ctx;
}
