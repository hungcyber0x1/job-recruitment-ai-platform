import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Sparkles, Send, ArrowRight, Brain, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const conversation = [
  {
    role: 'user',
    text: 'Tôi có 3 năm kinh nghiệm Frontend, muốn chuyển sang Fullstack. Nên bắt đầu từ đâu?',
    delay: 800,
  },
  {
    role: 'ai',
    text: 'Dựa trên hồ sơ của bạn, tôi phân tích được:',
    delay: 1500,
    details: [
      { icon: Brain, label: 'Kỹ năng hiện tại', value: 'React, TypeScript, CSS — Mạnh ở Frontend' },
      {
        icon: Target,
        label: 'Lộ trình đề xuất',
        value: 'Học Node.js + PostgreSQL trong 3-6 tháng',
      },
      { icon: TrendingUp, label: 'Cơ hội việc làm', value: '23 vị trí Fullstack phù hợp 85%+' },
    ],
  },
  {
    role: 'ai',
    text: 'Với nền tảng Frontend vững, bạn chỉ cần bổ sung Backend skills. Tôi gợi ý lộ trình 6 tháng:',
    delay: 2500,
    steps: [
      'Tháng 1-2: Node.js & Express cơ bản',
      'Tháng 3-4: Database & API design',
      'Tháng 5-6: DevOps & dự án thực tế',
    ],
  },
];

const suggestionChips = [
  'Xem lộ trình chi tiết',
  'Gợi ý khóa học',
  'Việc làm phù hợp',
  'Mức lương Fullstack',
];

const TypingIndicator = () => (
  <div className="flex items-center gap-2 px-4 py-3">
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary/50 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
    <span className="text-muted-foreground text-xs font-medium">AI đang phân tích...</span>
  </div>
);

const InteractiveAIDemo = () => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!hasStarted) return;
    let isMounted = true;
    const showMessages = async () => {
      for (let i = 0; i < conversation.length; i++) {
        if (!isMounted) return;
        setIsTyping(true);
        await new Promise((r) => setTimeout(r, conversation[i].delay));
        if (!isMounted) return;
        setIsTyping(false);
        setVisibleMessages((prev) => [...prev, conversation[i]]);
        await new Promise((r) => setTimeout(r, 400));
      }
      if (isMounted) {
        await new Promise((r) => setTimeout(r, 600));
        setShowChips(true);
      }
    };
    showMessages();
    return () => {
      isMounted = false;
    };
  }, [hasStarted]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleMessages, isTyping]);

  return (
    <section className="py-16 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10 space-y-5"
        >
          <span className="landing-badge">
            <Bot size={14} aria-hidden />
            AI Career Mentor
          </span>
          <h2 className="landing-heading">
            Trải nghiệm AI tư vấn <span className="landing-heading-muted">thực tế</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed font-medium max-w-[65ch]">
            AI hiểu ngữ cảnh, phân tích chuyên sâu và đưa ra lời khuyên nghề nghiệp được cá nhân hóa
            cho riêng bạn
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto"
        >
          <div className="landing-card rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(16,185,129,0.06)]">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bot size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-bold">HireAI Career Mentor</p>
                  <p className="text-primary text-xs font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    Sẵn sàng tư vấn
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold">
                <Sparkles size={12} className="text-primary" />
                GPT-4 Powered
              </div>
            </div>

            {/* Chat Body */}
            <div
              ref={containerRef}
              className="h-[420px] overflow-y-auto p-6 space-y-4 custom-scrollbar bg-muted/20"
            >
              {!hasStarted ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/12 flex items-center justify-center">
                    <Bot size={28} className="text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-foreground font-bold text-lg">
                      Xin chào! Tôi là AI Career Mentor
                    </p>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      Hãy xem tôi tư vấn nghề nghiệp như thế nào qua cuộc trò chuyện mẫu
                    </p>
                  </div>
                  <button
                    onClick={() => setHasStarted(true)}
                    className="landing-btn-primary px-6 py-3 text-sm"
                    aria-label="Xem demo trực tiếp cuộc trò chuyện AI"
                  >
                    <Sparkles size={16} aria-hidden />
                    Xem demo trực tiếp
                  </button>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {visibleMessages.map((msg, idx) => (
                      <motion.div
                        key={`msg-${idx}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className={msg.role === 'user' ? 'flex justify-end' : ''}
                      >
                        {msg.role === 'user' ? (
                          <div className="flex items-end gap-2 max-w-[85%]">
                            <div className="bg-primary/8 border border-primary/12 rounded-2xl rounded-br-sm px-5 py-3">
                              <p className="text-foreground text-sm leading-relaxed">{msg.text}</p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <User size={14} className="text-muted-foreground" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 max-w-[90%]">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                              <Bot size={14} className="text-primary" />
                            </div>
                            <div className="space-y-3">
                              <div className="bg-white border border-border/40 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                                <p className="text-foreground/80 text-sm leading-relaxed">
                                  {msg.text}
                                </p>
                              </div>
                              {msg.details && (
                                <div className="grid gap-2">
                                  {msg.details.map((detail, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.15, duration: 0.4 }}
                                      className="bg-white border border-border/40 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                                        <detail.icon size={14} className="text-primary" />
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                                          {detail.label}
                                        </p>
                                        <p className="text-foreground text-sm font-medium mt-0.5">
                                          {typeof detail.value === 'string'
                                            ? detail.value
                                            : (detail.value?.content ??
                                              detail.value?.title ??
                                              String(detail.value ?? ''))}
                                        </p>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                              {msg.steps && (
                                <div className="bg-white border border-border/40 rounded-xl px-5 py-4 space-y-2.5 shadow-sm">
                                  {msg.steps.map((step, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.2, duration: 0.4 }}
                                      className="flex items-center gap-3"
                                    >
                                      <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                        {i + 1}
                                      </div>
                                      <p className="text-foreground/80 text-sm">
                                        {typeof step === 'string' ? step : String(step ?? '')}
                                      </p>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isTyping && <TypingIndicator />}
                  <AnimatePresence>
                    {showChips && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap gap-2 pt-2"
                      >
                        {suggestionChips.map((chip) => (
                          <button
                            key={chip}
                            className="px-4 py-2 bg-primary/8 border border-primary/12 text-primary rounded-xl text-xs font-bold hover:bg-primary/15 transition-all"
                          >
                            {chip}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Chat Input */}
            <div className="px-6 py-4 border-t border-border/40 bg-white">
              <div className="flex items-center gap-3 bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
                <input
                  type="text"
                  placeholder="Hỏi AI bất cứ điều gì về sự nghiệp..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none font-medium"
                  readOnly
                />
                <button className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:text-primary/80 transition-colors group landing-focus rounded-lg py-1"
            >
              Trải nghiệm đầy đủ tại đây
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InteractiveAIDemo;
