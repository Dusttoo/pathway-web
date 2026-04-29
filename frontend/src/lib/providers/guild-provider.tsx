"use client";

import React, { createContext, useContext } from "react";

interface GuildContextType {
  currentGuildId: string | null;
}

const GuildContext = createContext<GuildContextType>({ currentGuildId: null });

export function GuildProvider({ children }: { children: React.ReactNode }) {
  return <GuildContext.Provider value={{ currentGuildId: null }}>{children}</GuildContext.Provider>;
}

export function useGuild() {
  return useContext(GuildContext);
}
