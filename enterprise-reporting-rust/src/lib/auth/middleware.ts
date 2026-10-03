"use server";

import { getRequest } from "@tanstack/react-start/server";
import { getSessionFromHeaders } from "./session";

/** The caller's session inside a server function, or null when signed out. */
export async function getServerSession() {
  try {
    const request = getRequest();
    if (!request) return null;
    return await getSessionFromHeaders(request.headers);
  } catch (e) {
    console.error("Failed to get session:", e);
    return null;
  }
}

/** Enforce authentication in server functions. */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
