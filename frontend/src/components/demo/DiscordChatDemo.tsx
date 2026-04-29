"use client";

import { Bot, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface Message {
  id: number;
  sender: "user" | "pathway";
  username: string;
  content: string;
  timestamp: string;
}

const demoMessages: Omit<Message, "id" | "timestamp">[] = [
  {
    sender: "user",
    username: "Thessaly",
    content: "/character sheet",
  },
  {
    sender: "pathway",
    username: "Pathway",
    content:
      "**Thessaly Ironweave** — Gnome Inventor 5\n\n**HP:** 48/48 · **AC:** 18 · **Speed:** 25 ft\n\n**Ability Scores**\nSTR 10 · DEX 16 (+3) · CON 14 (+2) · INT 20 (+5) · WIS 12 (+1) · CHA 10\n\n**Saves** Fort +8 · Ref +9 · Will +9\n\n**Class DC:** 21 · **Perception:** +9\n\n*Use `/spell` to browse prepared spells, or `/feat` to view your feats.*",
  },
  {
    sender: "user",
    username: "Thessaly",
    content: "/roll perception secret",
  },
  {
    sender: "pathway",
    username: "Pathway",
    content:
      "🎲 **Secret Perception Check — Thessaly**\n\n`1d20 (14) + 9 = **23**`\n\n*(Result hidden from other players)*",
  },
  {
    sender: "user",
    username: "Oryn",
    content: "/spell fireball",
  },
  {
    sender: "pathway",
    username: "Pathway",
    content:
      "**Fireball** — Spell 3 · Evocation · Fire\n\n**Cast** 2 actions · **Range** 500 ft · **Area** 20-foot burst · **Saving Throw** basic Reflex\n\nA burst of flame erupts at your target, dealing **6d6 fire damage** to all creatures in the area (basic Reflex save vs your spell DC).\n\n**Heightened (+1)** Damage increases by 2d6.",
  },
  {
    sender: "user",
    username: "Oryn",
    content: "nice, casting that at the golem. what's my spell DC?",
  },
  {
    sender: "pathway",
    username: "Pathway",
    content: "Your current **Spell DC is 22** (10 + 4 proficiency + 5 INT + 3 item bonus).\n\nThe Iron Golem rolls Reflex... `1d20 (3) + 8 = **11**` — **Critical Failure!** It takes **full double damage**: roll 12d6 fire. 🔥",
  },
];

export function DiscordChatDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const runDemo = async () => {
      for (let i = 0; i < demoMessages.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsTyping(true);
        const typingDelay = demoMessages[i].sender === "pathway" ? 1800 : 800;
        await new Promise((resolve) => setTimeout(resolve, typingDelay));
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            ...demoMessages[i],
            id: i,
            timestamp: new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
          },
        ]);
      }
    };

    runDemo();
  }, []);

  return (
    <div className="card overflow-hidden border-border">
      {/* Discord-style header */}
      <div className="bg-[#f2f3f5] dark:bg-[#2f3136] border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[#4e5058] dark:text-[#b9bbbe] font-semibold">#</span>
          <span className="text-[#060607] dark:text-white font-semibold">pf2e-session</span>
          <div className="h-4 w-px bg-border mx-2" />
          <span className="text-[#4e5058] dark:text-[#b9bbbe] text-sm">Live Session Demo</span>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[440px] overflow-y-auto p-4 space-y-4 bg-white dark:bg-[#36393f]">
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex gap-3 hover:bg-[#f2f3f5] dark:hover:bg-[#32353b] p-2 rounded -mx-2 transition-colors"
          >
            <div className="flex-shrink-0">
              {message.sender === "pathway" ? (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#3d5a8a] flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`font-semibold ${message.sender === "pathway" ? "text-primary" : "text-[#2e3338] dark:text-[#dcddde]"}`}>
                  {message.username}
                </span>
                {message.sender === "pathway" && (
                  <span className="bg-primary text-primary-foreground text-[10px] px-1 py-0.5 rounded font-semibold">
                    BOT
                  </span>
                )}
                <span className="text-[#5c5e66] dark:text-[#72767d] text-xs">{message.timestamp}</span>
              </div>
              <div className={`text-[#2e3338] dark:text-[#dcddde] text-sm break-words leading-relaxed ${message.sender === "pathway" ? "border-l-4 border-primary/60 pl-3 py-1 bg-[#f2f3f5] dark:bg-[#2b2d31] rounded" : ""}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({ ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                    ol: ({ ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                    li: ({ ...props }) => <li className="ml-2" {...props} />,
                    strong: ({ ...props }) => <strong className="font-bold text-[#1a1b1e] dark:text-white" {...props} />,
                    hr: ({ ...props }) => <hr className="border-t border-[#e3e5e8] dark:border-[#4e5058] my-2" {...props} />,
                    code: ({ className, children, ...props }: any) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-[#e3e5e8] dark:bg-[#1e1f22] px-1 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
                      ) : (
                        <code className="block bg-[#e3e5e8] dark:bg-[#1e1f22] p-2 rounded text-xs font-mono my-1" {...props}>{children}</code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <div className="w-2 h-2 bg-[#5c5e66] dark:bg-[#b9bbbe] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-[#5c5e66] dark:bg-[#b9bbbe] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-[#5c5e66] dark:bg-[#b9bbbe] rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-4 bg-white dark:bg-[#36393f]">
        <div className="bg-[#e3e5e8] dark:bg-[#40444b] rounded-lg px-4 py-3 text-[#5c5e66] dark:text-[#72767d] text-sm">
          Message #pf2e-session
        </div>
        <p className="text-[#5c5e66] dark:text-[#72767d] text-xs mt-2 text-center">
          Live demo — plays once on load
        </p>
      </div>
    </div>
  );
}
