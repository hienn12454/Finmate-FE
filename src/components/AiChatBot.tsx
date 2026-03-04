import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import axiosClient from "../api/axiosClient";
import styles from "./AiChatBot.module.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BTN_SIZE = 56;
const PANEL_H = 480;
const GAP = 12;

const SYSTEM_PROMPT = `Bạn là Finmate AI - trợ lý tài chính thông minh của ứng dụng Finmate.
Nhiệm vụ:
- Tư vấn quản lý tài chính cá nhân, lập kế hoạch tiết kiệm
- Phân tích và gợi ý chi tiêu hợp lý
- Trả lời câu hỏi về đầu tư, tiết kiệm, ngân sách
- Hỗ trợ người dùng dùng các tính năng của Finmate

Phong cách: Trả lời bằng tiếng Việt, ngắn gọn, thân thiện, dùng emoji khi phù hợp.`;

const QUICK_QUESTIONS = [
  "Làm sao tiết kiệm hiệu quả?",
  "Tôi nên đầu tư gì?",
  "Cách lập ngân sách 50/30/20?",
];

export default function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const [pos, setPos] = useState(() => ({
    x: Math.max(0, (typeof window !== "undefined" ? window.innerWidth : 1200) - 80),
    y: Math.max(0, (typeof window !== "undefined" ? window.innerHeight : 800) - 80),
  }));

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const totalMove = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Keep button in viewport on resize
  useEffect(() => {
    const onResize = () => {
      setPos((prev) => ({
        x: Math.min(prev.x, window.innerWidth - BTN_SIZE),
        y: Math.min(prev.y, window.innerHeight - BTN_SIZE),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ─── Mouse drag ───────────────────────────────────────────────────────────
  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      isDragging.current = true;
      totalMove.current = 0;
      dragStart.current = { x: clientX, y: clientY, posX: pos.x, posY: pos.y };
    },
    [pos]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    },
    [startDrag]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    },
    [startDrag]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      totalMove.current = Math.abs(dx) + Math.abs(dy);
      const newX = Math.max(0, Math.min(window.innerWidth - BTN_SIZE, dragStart.current.posX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - BTN_SIZE, dragStart.current.posY + dy));
      setPos({ x: newX, y: newY });
      setIsDraggingState(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - dragStart.current.x;
      const dy = t.clientY - dragStart.current.y;
      totalMove.current = Math.abs(dx) + Math.abs(dy);
      const newX = Math.max(0, Math.min(window.innerWidth - BTN_SIZE, dragStart.current.posX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - BTN_SIZE, dragStart.current.posY + dy));
      setPos({ x: newX, y: newY });
      setIsDraggingState(true);
    };

    const onEnd = () => {
      isDragging.current = false;
      setIsDraggingState(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  const handleFabClick = () => {
    if (totalMove.current > 6) return;
    setIsOpen((v) => !v);
  };

  // ─── Panel position (avoid viewport overflow) ────────────────────────────
  const panelStyle = useMemo(() => {
    const onRight = pos.x + BTN_SIZE / 2 > window.innerWidth / 2;
    const hasRoomAbove = pos.y >= PANEL_H + GAP + 10;
    return {
      ...(onRight ? { right: 0 } : { left: 0 }),
      ...(hasRoomAbove ? { bottom: BTN_SIZE + GAP } : { top: BTN_SIZE + GAP }),
    } as React.CSSProperties;
  }, [pos]);

  // ─── Chat logic ───────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const userMsg: Message = { role: "user", content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axiosClient.post("/chat", {
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...updated],
      });
      const aiContent = res.data?.content || "Xin lỗi, tôi không thể phản hồi lúc này.";
      setMessages((prev) => [...prev, { role: "assistant", content: aiContent }]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${errMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className={styles.container}
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Chat panel */}
      {isOpen && (
        <div
          className={styles.panel}
          style={panelStyle}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerAvatar}>
                <SparkleIcon size={20} />
              </div>
              <div>
                <div className={styles.headerTitle}>Finmate AI</div>
                <div className={styles.headerStatus}>
                  <span className={styles.statusDot} />
                  Trợ lý tài chính
                </div>
              </div>
            </div>
            <div className={styles.headerRight}>
              {messages.length > 0 && (
                <button
                  className={styles.iconBtn}
                  onClick={() => setMessages([])}
                  title="Xóa hội thoại"
                >
                  <TrashIcon />
                </button>
              )}
              <button
                className={styles.iconBtn}
                onClick={() => setIsOpen(false)}
                title="Đóng"
              >
                <CloseIcon size={13} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.length === 0 ? (
              <div className={styles.welcome}>
                <div className={styles.welcomeIcon}>✨</div>
                <p className={styles.welcomeTitle}>Xin chào! Tôi là Finmate AI</p>
                <p className={styles.welcomeSub}>
                  Hỏi tôi bất cứ điều gì về tài chính cá nhân!
                </p>
                <div className={styles.suggestions}>
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      className={styles.suggestionBtn}
                      onClick={() => sendMessage(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={msg.role === "user" ? styles.userRow : styles.aiRow}
                  >
                    {msg.role === "assistant" && (
                      <div className={styles.msgAvatar}>
                        <SparkleIcon size={14} />
                      </div>
                    )}
                    <div
                      className={
                        msg.role === "user" ? styles.userBubble : styles.aiBubble
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className={styles.aiRow}>
                    <div className={styles.msgAvatar}>
                      <SparkleIcon size={14} />
                    </div>
                    <div className={styles.aiBubble}>
                      <div className={styles.typing}>
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi..."
              disabled={isLoading}
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <div
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ""} ${isDraggingState ? styles.fabDragging : ""}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleFabClick}
        role="button"
        tabIndex={0}
        aria-label="Finmate AI Chat"
      >
        {isOpen ? <CloseIcon size={18} /> : <SparkleIcon size={26} />}
        {!isOpen && <div className={styles.pulse} />}
      </div>
    </div>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function SparkleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="19" cy="4" r="1.5" fill="white" fillOpacity="0.75" />
      <circle cx="5" cy="18" r="1" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

function CloseIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <line x1="1" y1="1" x2="13" y2="13" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="13" y1="1" x2="1" y2="13" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <polygon points="2,2 18,10 2,18 6,10" fill="white" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {/* Nắp thùng */}
      <rect x="1" y="2.5" width="12" height="1.5" rx="0.7" fill="white" />
      <rect x="4.5" y="0.5" width="5" height="1.8" rx="0.7" fill="white" />
      {/* Thân thùng */}
      <path d="M2.5 5L3.2 12.2C3.3 12.7 3.7 13 4.2 13H9.8C10.3 13 10.7 12.7 10.8 12.2L11.5 5H2.5Z" fill="white" />
      {/* 3 sọc dọc */}
      <line x1="5" y1="6.5" x2="5" y2="11" stroke="rgba(6,9,24,0.5)" strokeWidth="1" strokeLinecap="round" />
      <line x1="7" y1="6.5" x2="7" y2="11" stroke="rgba(6,9,24,0.5)" strokeWidth="1" strokeLinecap="round" />
      <line x1="9" y1="6.5" x2="9" y2="11" stroke="rgba(6,9,24,0.5)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
