"use client";

import { AppRoot, ConfigProvider } from "datui";
import { usePrefs } from "@/hooks/usePrefs";

/** datui theme for the landing page; follows the theme chosen in the app (or the system). */
export function LandingRoot({ children }: { children: React.ReactNode }) {
  const { theme } = usePrefs();
  return (
    <ConfigProvider colorScheme={theme}>
      <AppRoot>{children}</AppRoot>
    </ConfigProvider>
  );
}
