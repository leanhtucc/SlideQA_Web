import { useContext } from "react";
import { AuthContext, type AuthValue } from "src/contexts/AuthContext";

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth phải nằm trong AuthProvider");
  return v;
}
