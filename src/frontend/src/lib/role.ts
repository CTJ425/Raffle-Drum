import type { Role } from "../types";

export function getRole(search: string): Role {
  const params = new URLSearchParams(search);
  return params.get("role") === "host" ? "host" : "viewer";
}
