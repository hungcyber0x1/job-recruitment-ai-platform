import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanSearch, Upload, CheckCircle2, Sparkles, File, X } from 'lucide-react';

const ACCEPT = '.pdf,.doc,.docx';
const MAX_SIZE_MB = 5;

const AICVScanner = () => {
  const [status, setStatus] = useState('idle');
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = (f) => {
    setError(null);
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPT.split(',').some((e) => e.trim() === ext)) {
      setError('Chỉ chấp nhận file .pdf, .doc, .docx');
      return false;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Kích thước tối đa ${MAX_SIZE_MB} MB`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (validateFile(f)) {
      setFile(f);
      setStatus('idle');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (validateFile(f)) {
      setFile(f);
      setStatus('idle');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleScan = () => {
    if (file) {
      setStatus('scanning');
      setTimeout(() => setStatus('result'), 2500);
    } else {
      inputRef.current?.click();
    }
  };

  const removeFile = (e) => {
    e?.stopPropagation();
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="landing-card bg-background p-8 lg:p-10 flex flex-col min-h-[480px] rounded-xl group/scanner card-premium-hover">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary/8 text-primary border border-primary/12 flex items-center justify-center group-hover/scanner:bg-primary group-hover/scanner:text-white group-hover/scanner:border-primary transition-all duration-300">
          <ScanSearch size={22} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground leading-tight group-hover/scanner:text-primary transition-colors">
            Chấm điểm CV bằng AI
          </h3>
          <p className="text-base text-muted-foreground font-medium mt-0.5">
            Phân tích và gợi ý cải thiện hồ sơ
          </p>
        </div>
      </div>

      <div className="flex-1 bg-muted/40 border border-border/30 rounded-xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="flex flex-col items-center justify-center w-full"
          >
            {status === 'idle' ? (
              <div
                onClick={() => (file ? handleScan() : inputRef.current?.click())}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    file ? handleScan() : inputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Tải lên CV của bạn để phân tích"
                className="flex flex-col items-center cursor-pointer relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-xl w-full"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {!file ? (
                  <>
                    <div className="h-16 w-16 bg-background border border-border/60 rounded-xl flex items-center justify-center mb-5 hover:border-primary/40 hover:shadow-[0_8px_24px_-8px_rgba(var(--primary-shadow),0.12)] transition-all duration-300 active:scale-[0.95]">
                      <Upload size={24} className="text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="text-base font-semibold text-muted-foreground mb-1">
                      Tải lên CV của bạn
                    </p>
                    <p className="text-base text-muted-foreground max-w-[220px] leading-relaxed">
                      Kéo thả hoặc nhấn để chọn — .pdf, .docx (tối đa 5 MB)
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/15 rounded-xl mb-4 w-full max-w-[280px]">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <File size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-base font-semibold text-foreground truncate">
                          {file.name}
                        </p>
                        <p className="text-base text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(e);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        aria-label="Xóa file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-base font-semibold text-primary mb-1">Nhấn để phân tích</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        inputRef.current?.click();
                      }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                    >
                      Chọn file khác
                    </button>
                  </>
                )}
                {error && <p className="mt-3 text-base text-red-600 font-medium">{error}</p>}
              </div>
            ) : status === 'scanning' ? (
              <div className="flex flex-col items-center relative z-10 w-full max-w-xs">
                <div className="w-full h-1.5 bg-muted rounded-full mb-6 relative overflow-hidden">
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '92%' }}
                    transition={{ duration: 1.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <p className="text-base font-semibold text-primary">Đang phân tích CV…</p>
              </div>
            ) : (
              <div className="w-full space-y-6 relative z-10">
                <div className="space-y-2">
                  <p className="text-6xl font-extrabold text-foreground tracking-normal tabular-nums leading-none">
                    85<span className="text-xl text-primary/50 font-bold">/100</span>
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/8 text-primary border border-primary/12 rounded-lg">
                    <CheckCircle2 size={12} aria-hidden="true" />
                    <span className="text-sm font-semibold">Hồ sơ tốt</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-background rounded-lg border border-border/30 text-left">
                    <p className="text-base font-semibold text-muted-foreground uppercase tracking-normal mb-1">
                      Điểm mạnh
                    </p>
                    <p className="text-base font-medium text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" /> Phát triển
                      fullstack
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border border-border/30 text-left">
                    <p className="text-base font-semibold text-muted-foreground uppercase tracking-normal mb-1">
                      Cần bổ sung
                    </p>
                    <p className="text-base font-medium text-primary flex items-center gap-2">
                      <Sparkles size={14} aria-hidden="true" /> Thêm từ khoá về Cloud và DevOps
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStatus('idle');
                    removeFile();
                  }}
                  className="landing-link text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded"
                >
                  Thử lại với CV khác
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AICVScanner;
