/**
 * MDX Components for Enhanced Documentation
 * Custom components for rendering markdown with better styling
 */

import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Terminal,
} from "lucide-react";
import { ReactNode } from "react";

interface CalloutProps {
  children: ReactNode;
  type?: "info" | "warning" | "success" | "error";
}

export function Callout({ children, type = "info" }: CalloutProps) {
  const styles = {
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: (
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      ),
    },
    success: {
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800",
      icon: (
        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
      ),
    },
    error: {
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      icon: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
    },
  };

  const style = styles[type];

  return (
    <div
      className={`${style.bg} ${style.border} border-2 rounded-lg p-4 my-6 flex gap-3`}
    >
      <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
      <div className="flex-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

interface CodeBlockProps {
  children: ReactNode;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const language = className?.replace("language-", "") || "text";

  return (
    <div className="relative group my-6">
      <div className="absolute top-3 right-3 text-xs text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">
        {language}
      </div>
      <pre className="bg-muted border-2 border-border rounded-lg p-4 overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="bg-muted text-primary px-1.5 py-0.5 rounded text-sm font-mono border border-border">
      {children}
    </code>
  );
}

interface StepProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function Step({ number, title, children }: StepProps) {
  return (
    <div className="relative pl-8 pb-8 border-l-2 border-primary/30 last:border-l-0 last:pb-0">
      <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
        {number}
      </div>
      <div>
        <h3 className="font-heading font-bold text-lg mb-2">{title}</h3>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export function CommandLine({ children }: { children: ReactNode }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border-2 border-slate-700 rounded-lg p-4 my-6">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="h-4 w-4 text-green-400" />
        <span className="text-xs text-slate-400 font-mono">Terminal</span>
      </div>
      <pre className="text-green-400 font-mono text-sm overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
}

interface ChecklistItemProps {
  checked: boolean;
  children: ReactNode;
}

export function ChecklistItem({ checked, children }: ChecklistItemProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
          checked ? "bg-primary border-primary" : "border-muted-foreground"
        }`}
      >
        {checked && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
      </div>
      <div className={checked ? "line-through text-muted-foreground" : ""}>
        {children}
      </div>
    </div>
  );
}

export const MDXComponents = {
  // Headings
  h1: ({ children, ...props }: any) => (
    <h1
      className="text-3xl font-heading font-bold text-foreground mt-8 mb-4 scroll-mt-24"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2
      className="text-2xl font-heading font-bold text-foreground mt-8 mb-3 scroll-mt-24 pb-2 border-b-2 border-border"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3
      className="text-xl font-heading font-bold text-foreground mt-6 mb-2 scroll-mt-24"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4
      className="text-lg font-heading font-semibold text-foreground mt-4 mb-2 scroll-mt-24"
      {...props}
    >
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children, ...props }: any) => (
    <p className="text-foreground leading-7 mb-4" {...props}>
      {children}
    </p>
  ),

  // Lists
  ul: ({ children, ...props }: any) => (
    <ul
      className="list-disc list-inside space-y-2 mb-4 text-foreground"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol
      className="list-decimal list-inside space-y-2 mb-4 text-foreground"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="ml-4" {...props}>
      {children}
    </li>
  ),

  // Code
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) {
      return <InlineCode>{children}</InlineCode>;
    }
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
  pre: ({ children, ...props }: any) => <div {...props}>{children}</div>,

  // Blockquote
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-primary pl-4 italic text-muted-foreground my-6"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Links
  a: ({ children, href, ...props }: any) => (
    <a
      href={href}
      className="text-primary hover:underline font-medium"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),

  // Tables
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-6">
      <table
        className="w-full border-collapse border-2 border-border"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: any) => (
    <th
      className="border-2 border-border bg-muted px-4 py-2 text-left font-semibold"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="border-2 border-border px-4 py-2" {...props}>
      {children}
    </td>
  ),

  // Horizontal Rule
  hr: (props: any) => (
    <hr className="my-8 border-t-2 border-border" {...props} />
  ),

  // Images
  img: ({ src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      className="rounded-lg border-2 border-border my-6 max-w-full h-auto"
      {...props}
    />
  ),

  // Custom Components
  Callout,
  Step,
  CommandLine,
  ChecklistItem,
};
