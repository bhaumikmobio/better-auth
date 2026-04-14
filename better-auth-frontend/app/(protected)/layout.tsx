import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getServerSessionState } from "@/lib/auth-server";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessionState = await getServerSessionState();

  if (sessionState.status === "unauthenticated") {
    redirect(ROUTES.login);
  }

  return children;
}
