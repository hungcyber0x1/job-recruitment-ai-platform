import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle2,
  BarChart3,
  AlertCircle,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import AIPublicToolShell from '@/components/public/AIPublicToolShell';
import publicToolsService from '@/services/publicToolsService';

const MAX_BYTES = 5 * 1024 * 1024;
const MIME_ALLOW = new Set(['application/pdf']);

function validateFile(f) {
  if (!f) return 'Chưa chọn file.';
  if (f.size > MAX_BYTES) return 'File vượt quá 5MB. Vui lòng nén hoặc tải bản nhẹ hơn.';
  const lower = f.name.toLowerCase();
  if (!lower.endsWith('.pdf') && !MIME_ALLOW.has(f.type)) {
    return 'Phân tích AI hiện chỉ hỗ trợ PDF. Vui lòng xuất CV sang PDF.';
  }
  return null;
}

const AICVScannerPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
    e.target.value = '';
  };

  const handleFile = async (uploadedFile) => {
    setFileError(null);
    setResult(null);
    const err = validateFile(uploadedFile);
    if (err) {
      setFile(null);
      setFileError(err);
      return;
    }
    setFile(uploadedFile);
    setProgress(5);
    setAnalyzing(true);
    try {
      const { data } = await publicToolsService.cvPreview(uploadedFile, (e) => {
        if (e.total) {
          const pct = 5 + Math.round((e.loaded / e.total) * 35);
          setProgress(Math.min(40, pct));
        }
      });
      if (!data?.success || !data.data) {
        throw new Error('Phản hồi không hợp lệ');
      }
      const d = data.data;
      setProgress(92);
      setResult({
        score: Math.round(Number(d.overall_score) || 0),
        keywordsFound: d.keywords_found ?? 0,
        missingKeywords: d.missing_keywords_estimate ?? 0,
        formatScore: d.format_label || '—',
        suggestions: Array.isArray(d.suggestions) ? d.suggestions : [],
        strengths: Array.isArray(d.strengths) ? d.strengths : [],
        weaknesses: Array.isArray(d.weaknesses) ? d.weaknesses : [],
      });
      setProgress(100);
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        e.message ||
        'Không phân tích được CV. Kiểm tra kết nối hoặc thử file PDF khác.';
      setFileError(msg);
      setFile(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setFile(null);
    setFileError(null);
    setProgress(0);
    setAnalyzing(false);
  };

  const titleNode = (
    <>
      Chấm điểm CV bằng <span className="text-primary">AI</span>
    </>
  );

  return (
    <AIPublicToolShell
      kicker="HireBOT · Ứng viên"
      icon={BarChart3}
      title={titleNode}
      description="Tải CV (PDF) để AI đánh giá mức độ sẵn sàng ứng tuyển: điểm tổng quan, từ khóa liên quan tin tuyển dụng (ATS) và gợi ý chỉnh sửa. Dùng trước khi nộp hồ sơ qua HireBOT — kết quả xem tại chỗ, không tự lưu vào hồ sơ."
    >
      <div className="mx-auto max-w-4xl">
        {fileError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-base font-medium text-destructive"
          >
            <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
            {fileError}
          </div>
        )}

        {!result ? (
          <div className="ai-tool-panel p-8 md:p-10">
            {analyzing ? (
              <div className="py-12 text-center md:py-16">
                <div className="relative mx-auto mb-6 h-20 w-20">
                  <div className="absolute inset-0 rounded-full border-4 border-muted" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <Sparkles
                    className="absolute inset-0 m-auto size-7 text-primary animate-pulse"
                    aria-hidden
                  />
                </div>
                <h3 className="mb-2 text-xl font-bold text-foreground md:text-2xl">
                  AI đang phân tích CV của bạn…
                </h3>
                <p className="mb-6 text-base font-medium text-muted-foreground">
                  Quá trình này thường mất vài giây.
                </p>
                <div className="mx-auto max-w-md space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-base font-bold tabular-nums text-muted-foreground">
                    {Math.round(progress)}%
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div
                  className={`
                    relative rounded-xl border-2 border-dashed p-10 text-center transition-all duration-300 md:p-12
                    ${dragActive ? 'scale-[1.01] border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'}
                    ${file ? 'border-primary bg-primary/5' : ''}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <label
                    htmlFor="cv-upload"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer"
                  />
                  <input
                    id="cv-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,application/pdf"
                    onChange={handleChange}
                  />
                  {file ? (
                    <div className="relative z-0 flex flex-col items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="size-8" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground md:text-xl">{file.name}</p>
                        <p className="mt-1 text-base font-medium text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-sm font-bold">
                        Sẵn sàng phân tích
                      </Badge>
                    </div>
                  ) : (
                    <div className="relative z-0 flex flex-col items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <Upload className="size-8" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="mb-2 text-xl font-bold text-foreground md:text-2xl">
                          Kéo thả file CV vào đây
                        </p>
                        <p className="mb-6 text-base font-medium text-muted-foreground">
                          Hoặc chọn file PDF (tối đa 5MB)
                        </p>
                        <Button size="lg" className="pointer-events-none text-base font-bold">
                          Tải CV lên
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 border-t border-border/60 pt-8">
                  <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground md:text-xl">
                    <CheckCircle2 className="text-primary" size={20} strokeWidth={2} />
                    Lý do nên dùng công cụ này
                  </h4>
                  <ul className="ml-6 list-disc space-y-2 text-base font-medium text-muted-foreground">
                    <li>CV thân thiện với hệ thống quét ATS</li>
                    <li>Gợi ý từ khóa và cấu trúc nội dung</li>
                    <li>File chỉ dùng cho phiên phân tích; không gắn với tài khoản ứng viên</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="ai-tool-panel p-8 md:p-10">
            <div className="mb-8 flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground md:text-2xl">Kết quả phân tích</h2>
                <p className="mt-1 text-base font-medium text-muted-foreground">
                  File: {file?.name}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-base font-bold"
                  onClick={resetScan}
                >
                  Quét CV khác
                </Button>
                <Button size="sm" asChild className="gap-1.5 text-base font-bold">
                  <Link to="/jobs">Xem việc làm phù hợp</Link>
                </Button>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/40 bg-muted/50 p-6 text-center">
                <p className="mb-1 text-base font-semibold text-muted-foreground">Điểm ATS</p>
                <p className="text-4xl font-bold tabular-nums text-primary md:text-5xl">
                  {result.score}
                </p>
                <p className="mt-1 text-base font-medium text-muted-foreground">trên 100</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-muted/50 p-6 text-center">
                <p className="mb-1 text-base font-semibold text-muted-foreground">
                  Từ khóa tìm thấy
                </p>
                <p className="text-4xl font-bold tabular-nums text-primary md:text-5xl">
                  {result.keywordsFound}
                </p>
                <p className="mt-1 text-base font-medium text-muted-foreground">
                  Thiếu ~{result.missingKeywords} nhóm từ gợi ý
                </p>
              </div>
              <div className="rounded-xl border border-border/40 bg-muted/50 p-6 text-center">
                <p className="mb-1 text-base font-semibold text-muted-foreground">Định dạng</p>
                <p className="text-xl font-bold text-foreground md:text-2xl">
                  {result.formatScore}
                </p>
              </div>
            </div>

            {(result.strengths?.length > 0 || result.weaknesses?.length > 0) && (
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {result.strengths?.length > 0 && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <p className="mb-3 text-base font-bold uppercase tracking-normal text-emerald-700 dark:text-emerald-400">
                      Điểm mạnh (AI)
                    </p>
                    <ul className="list-disc space-y-1.5 pl-4 text-base font-medium text-foreground/90">
                      {result.strengths.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.weaknesses?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                    <p className="mb-3 text-base font-bold uppercase tracking-normal text-amber-800 dark:text-amber-400">
                      Cần cải thiện (AI)
                    </p>
                    <ul className="list-disc space-y-1.5 pl-4 text-base font-medium text-foreground/90">
                      {result.weaknesses.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl">
                <AlertCircle className="text-primary" size={20} strokeWidth={2} />
                Gợi ý cải thiện từ AI
              </h3>
              <div className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-base font-medium text-foreground">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AIPublicToolShell>
  );
};

export default AICVScannerPage;
