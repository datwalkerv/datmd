"use client";

import dynamic from "next/dynamic";

// The whole app lives in IndexedDB + localStorage, so render it on the client only (no hydration mismatch).
export const ClientApp = dynamic(() => import("./App").then((m) => m.App), { ssr: false });
