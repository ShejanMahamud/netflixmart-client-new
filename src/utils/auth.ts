// src/utils/auth.ts
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export interface DecodedToken {
  id: string;
  role: "user" | "admin";
}

export const getToken = (): string | undefined => {
  return Cookies.get("token");
};

export const getDecodedToken = (): DecodedToken | null => {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error("Invalid token");
    return null;
  }
};
