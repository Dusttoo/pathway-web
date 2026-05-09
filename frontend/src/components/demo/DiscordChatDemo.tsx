"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

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
      "**Thessaly Ironweave** - Gnome Inventor 5\n\n**HP:** 48/48 | **AC:** 18 | **Speed:** 25 ft\n\n**Ability Scores**\nSTR 10 | DEX 16 (+3) | CON 14 (+2) | INT 20 (+5) | WIS 12 (+1) | CHA 10\n\n**Saves** Fort +8 | Ref +9 | Will +9\n\n**Class DC:** 21 | **Perception:** +9\n\n*Use `/spell` to browse prepared spells, or `/feat` to view your feats.*",
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
      "**Secret Perception Check - Thessaly**\n\n`1d20 (14) + 9 = **23**`\n\n*(Result hidden from other players)*",
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
      "**Fireball** - Spell 3 | Evocation | Fire\n\n**Cast** 2 actions | **Range** 500 ft | **Area** 20-foot burst | **Saving Throw** basic Reflex\n\nA burst of flame erupts at your target, dealing **6d6 fire damage** to all creatures in the area (basic Reflex save vs your spell DC).\n\n**Heightened (+1)** Damage increases by 2d6.",
  },
  {
    sender: "user",
    username: "Oryn",
    content: "nice, casting that at the golem. what's my spell DC?",
  },
  {
    sender: "pathway",
    username: "Pathway",
    content:
      "Your current **Spell DC is 22** (10 + 4 proficiency + 5 INT + 3 item bonus).\n\nThe Iron Golem rolls Reflex... `1d20 (3) + 8 = **11**` - **Critical Failure!** It takes **full double damage**: roll 12d6 fire.",
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
    <div className="overflow-hidden rounded-lg border border-[#192448]/12 bg-white shadow-xl">
      <div className="border-b border-[#192448]/12 bg-[#2f3136] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#b9bbbe]">#</span>
          <span className="font-semibold text-white">pf2e-session</span>
          <div className="mx-2 h-4 w-px bg-white/14" />
          <span className="text-sm text-[#b9bbbe]">Pathway demo</span>
        </div>
      </div>

      <div className="h-[440px] space-y-4 overflow-y-auto bg-[#36393f] p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex gap-3 rounded p-2 transition-colors hover:bg-[#32353b]"
          >
            <div className="shrink-0">
              {message.sender === "pathway" ? (
                <Image
                  src="/images/pathway-avatar.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border border-[#d5a63a]/35 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3d5a8a]">
                  <User className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline gap-2">
                <span
                  className={`font-semibold ${
                    message.sender === "pathway" ? "text-[#d5a63a]" : "text-[#dcddde]"
                  }`}
                >
                  {message.username}
                </span>
                {message.sender === "pathway" && (
                  <span className="rounded bg-[#d5a63a] px-1 py-0.5 text-[10px] font-semibold text-[#111528]">
                    BOT
                  </span>
                )}
                <span className="text-xs text-[#8c8f96]">{message.timestamp}</span>
              </div>
              <div
                className={`break-words text-sm leading-relaxed text-[#dcddde] ${
                  message.sender === "pathway"
                    ? "rounded border-l-4 border-[#d5a63a] bg-[#2b2d31] py-2 pl-3 pr-2"
                    : ""
                }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({ ...props }) => (
                      <ul className="mb-2 list-inside list-disc space-y-1" {...props} />
                    ),
                    ol: ({ ...props }) => (
                      <ol className="mb-2 list-inside list-decimal space-y-1" {...props} />
                    ),
                    li: ({ ...props }) => <li className="ml-2" {...props} />,
                    strong: ({ ...props }) => (
                      <strong className="font-bold text-white" {...props} />
                    ),
                    hr: ({ ...props }) => (
                      <hr className="my-2 border-t border-[#4e5058]" {...props} />
                    ),
                    code: ({ className, children, ...props }: any) => {
                      const isInline = !className;
                      return isInline ? (
                        <code
                          className="rounded bg-[#1e1f22] px-1 py-0.5 font-mono text-xs"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className="my-1 block rounded bg-[#1e1f22] p-2 font-mono text-xs"
                          {...props}
                        >
                          {children}
                        </code>
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
            <Image
              src="/images/pathway-avatar.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-full border border-[#d5a63a]/35 object-cover"
            />
            <div className="mt-2 flex items-center gap-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-[#b9bbbe] [animation-delay:-0.3s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-[#b9bbbe] [animation-delay:-0.15s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-[#b9bbbe]" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[#4e5058] bg-[#36393f] p-4">
        <div className="rounded-lg bg-[#40444b] px-4 py-3 text-sm text-[#b9bbbe]">
          Message #pf2e-session
        </div>
        <p className="mt-2 text-center text-xs text-[#8c8f96]">Live demo - plays once on load</p>
      </div>
    </div>
  );
}
