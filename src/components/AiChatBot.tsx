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

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="white">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
      <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="white">
      <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5.5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z" />
    </svg>
  );
}
