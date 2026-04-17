import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { auth, hasRole } from "@/lib/auth";
import type { UserRole } from "@/types/user.types";

type RequiredRole = UserRole;

export async function getSessionOrRedirect(requiredRole?: RequiredRole) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(ROUTES.login);
  }

  if (requiredRole && !hasRole(session.user.role, requiredRole)) {
    redirect(ROUTES.unauthorized);
  }

  return session;
}
