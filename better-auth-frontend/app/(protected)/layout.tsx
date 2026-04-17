import { getSessionOrRedirect } from "@/lib/server/get-session-or-redirect";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await getSessionOrRedirect();

  return children;
}
