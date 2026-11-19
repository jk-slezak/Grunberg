"use client";

import type { ReactNode } from "react";
import { GameStateProvider } from "@/contexts/GameStateContext";

export const Providers = ({ children }: { children: ReactNode }) => (
  <GameStateProvider>{children}</GameStateProvider>
);
