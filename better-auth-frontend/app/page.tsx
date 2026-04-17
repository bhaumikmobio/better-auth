"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppLoader } from "@/components/ui/AppLoader";
import { LOADER_COPY } from "@/constants/messages";
import { ROUTES } from "@/constants/routes";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.login);
  }, [router]);

  return <AppLoader message={LOADER_COPY.redirectingToLogin} />;
}
