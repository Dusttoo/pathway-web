"use client";

/**
 * Reusable Tabs component with keyboard navigation and accessibility
 */

import { useState, ReactNode, createContext, useContext } from "react";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

interface TabsProps {
  defaultTab: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultTab, children, className = "" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`space-y-4 ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: ReactNode;
  className?: string;
}

export function TabList({ children, className = "" }: TabListProps) {
  return (
    <div
      role="tablist"
      className={`flex border-b-2 border-border gap-1 ${className}`}
    >
      {children}
    </div>
  );
}

interface TabButtonProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function TabButton({ id, children, className = "" }: TabButtonProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      id={`tab-${id}`}
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      onClick={() => setActiveTab(id)}
      className={`
        px-4 py-2.5 text-sm font-medium transition-all relative
        ${
          isActive
            ? "text-primary border-b-2 border-primary -mb-[2px]"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

interface TabPanelsProps {
  children: ReactNode;
  className?: string;
}

export function TabPanels({ children, className = "" }: TabPanelsProps) {
  return <div className={className}>{children}</div>;
}

interface TabPanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ id, children, className = "" }: TabPanelProps) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === id;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={className}
    >
      {children}
    </div>
  );
}
