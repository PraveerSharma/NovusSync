import { parseAuthAccessMode, type AuthAccessMode } from "@novussync/config/server";

export function getAuthAccessMode(): AuthAccessMode {
  return parseAuthAccessMode(process.env.AUTH_ACCESS_MODE);
}
