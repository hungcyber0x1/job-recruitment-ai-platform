import React, { useEffect, useMemo, useState } from 'react';
import {
  User,
  Video,
  Mic,
  Bot,
  Play,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import AIPublicToolShell from '@/components/public/AIPublicToolShell';
import publicToolsService from '@/services/publicToolsService';

const FEATURES = [
  {
    title: 'Phỏng vấn chuyên sâu',
    desc: 'Bộ câu hỏi theo lĩnh vực (kỹ thuật, kinh doanh, marketing…) — gần với phỏng vấn tuyển dụng thật.',
    icon: Video,
  },
  {
    title: 'Tư duy nhà tuyển dụng',
    desc: 'Tình huống và câu hỏi hành vi để luyện diễn đạt, STAR và phản biện có cấu trúc.',
    icon: Mic,
  },
  {
    title: 'Gợi ý AI từng câu',
    desc: 'Bấm lấy gợi ý cấu trúc câu trả lời (khi máy chủ AI được cấu hình).',
    icon: Bot,
  },
];

const ROLES = [
  { value: 'software', label: 'Công nghệ / Kỹ thuật phần mềm' },
  { value: 'business', label: 'Kinh doanh / Bán hàng' },
  { value: 'marketing', label: 'Marketing / Truyền thông' },
  { value: 'general', label: 'Tổng quát / Văn phòng' },
];

const LEVELS = [
  { value: 'junior', label: 'Cấp cơ bản / 1–3 năm' },
  { value: 'mid', label: 'Cấp trung / 3–5 năm' },
  { value: 'senior', label: 'Cấp cao / 5+ năm' },
];

const QUESTION_BANK = {
  software: [
    {
      q: 'Hãy mô tả một kiến trúc hoặc module bạn từng thiết kế mà bạn tự hào nhất.',
      hint: 'Nêu bài toán, lý do chọn công nghệ, trade-off và kết quả đo lường được.',
    },
    {
      q: 'Khi môi trường vận hành thật gặp sự cố độ trễ tăng đột biến, bạn ưu tiên các bước nào?',
      hint: 'Giảm thiểu ảnh hưởng người dùng, quan sát, giả thuyết, quay lui/phát hành thăm dò, hậu kiểm.',
    },
    {
      q: 'Bạn cân bằng giữa phát hành nhanh và chất lượng mã nguồn như thế nào?',
      hint: 'Rủi ro nghiệp vụ, nợ kỹ thuật có kiểm soát, tiêu chí rà soát và kiểm thử tối thiểu.',
    },
    {
      q: 'Một đồng nghiệp không đồng ý với quyết định kỹ thuật của bạn. Bạn xử lý ra sao?',
      hint: 'Dữ liệu, tiêu chí, nguyên mẫu nhỏ, đồng thuận với các bên liên quan.',
    },
    {
      q: 'Trong 90 ngày đầu ở vị trí mới, bạn sẽ làm gì để tạo giá trị?',
      hint: 'Hòa nhập, lập sơ đồ hệ thống/con người, kết quả nhanh có đo lường, lộ trình 30-60-90.',
    },
  ],
  business: [
    {
      q: 'Kể một thương vụ khó — bạn đã vượt qua bằng cách nào?',
      hint: 'Bên mua, điểm đau, phản đối, cách dẫn dắt và kết quả (số liệu nếu có).',
    },
    {
      q: 'Làm sao bạn xây dựng phễu bán hàng bền vững thay vì chỉ “chạy nước rút”?',
      hint: 'Chân dung khách hàng lý tưởng, kênh, chuẩn hóa kịch bản, CRM, theo dõi chuyển đổi.',
    },
    {
      q: 'Khách hàng so sánh bạn với đối thủ rẻ hơn. Bạn trả lời thế nào?',
      hint: 'Giá trị, rủi ro, ví dụ triển khai, tỷ suất hoàn vốn, điều khoản linh hoạt.',
    },
    {
      q: 'Mô tả lần bạn không đạt chỉ tiêu và bài học rút ra.',
      hint: 'Nguyên nhân khách quan/chủ quan, hành động khắc phục, chỉ số theo dõi sau đó.',
    },
    {
      q: 'Bạn ưu tiên khách hàng mới hay giữ chân khách hiện hữu khi nguồn lực hạn chế?',
      hint: 'Hiệu quả kinh tế trên từng đơn vị, giá trị vòng đời khách hàng, chiến lược phân bổ, ví dụ cụ thể.',
    },
  ],
  marketing: [
    {
      q: 'Chiến dịch gần đây bạn chạy — mục tiêu, kênh và chỉ số đo lường là gì?',
      hint: 'Phễu chuyển đổi, thấu hiểu sáng tạo, tối ưu, bài học thử nghiệm A/B.',
    },
    {
      q: 'Làm sao bạn đo hiệu quả thương hiệu và hiệu suất trong cùng ngân sách?',
      hint: 'Ghi nhận đóng góp kênh, nhóm đối chứng, mức tăng nhận diện thương hiệu, chi phí khách hàng/hiệu quả quảng cáo tổng hợp.',
    },
    {
      q: 'Khi có khủng hoảng truyền thông, bạn phản ứng theo quy trình nào?',
      hint: 'Xác thực, thông điệp, kênh phản hồi, mốc thời gian, trách nhiệm pháp lý và truyền thông.',
    },
    {
      q: 'Bạn thuyết phục ban lãnh đạo đầu tư vào một kênh mới chưa chứng minh được tỷ suất hoàn vốn như thế nào?',
      hint: 'Giả thuyết, thử nghiệm nhỏ, ngưỡng tiếp tục/dừng, rủi ro.',
    },
    {
      q: 'Nội dung nào phù hợp với nhóm khán giả của bạn và vì sao?',
      hint: 'Thấu hiểu khách hàng, định dạng, phân phối, lặp lại/mở rộng.',
    },
  ],
  general: [
    {
      q: 'Giới thiệu ngắn về bản thân và động lực nghề nghiệp của bạn.',
      hint: 'Gắn với vị trí ứng tuyển, 2–3 điểm mạnh có ví dụ.',
    },
    {
      q: 'Một dự án bạn dẫn dắt hoặc đóng góp rõ rệt — vai trò và kết quả?',
      hint: 'STAR: tình huống, nhiệm vụ, hành động, kết quả định lượng.',
    },
    {
      q: 'Bạn xử lý hạn chót gấp và nhiều bên liên quan như thế nào?',
      hint: 'Ưu tiên, giao tiếp, phạm vi, báo cáo lên cấp cao hơn khi cần.',
    },
    {
      q: 'Điểm yếu bạn đang cải thiện là gì?',
      hint: 'Thành thật + hành động cụ thể, tránh cliché vô nghĩa.',
    },
    {
      q: 'Tại sao bạn muốn làm việc tại công ty / ngành này?',
      hint: 'Nghiên cứu công ty, giá trị cá nhân khớp với sứ mệnh/sản phẩm.',
    },
  ],
};

const AIInterviewPage = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [role, setRole] = useState('software');
  const [level, setLevel] = useState('mid');
  const [draftRole, setDraftRole] = useState('software');
  const [draftLevel, setDraftLevel] = useState('mid');
  const [qIndex, setQIndex] = useState(0);
  const [aiExtra, setAiExtra] = useState(null);
  const [aiExtraLoading, setAiExtraLoading] = useState(false);
  const [aiExtraError, setAiExtraError] = useState(null);

  const handleSheetOpenChange = (open) => {
    setSheetOpen(open);
    if (open) {
      setDraftRole(role);
      setDraftLevel(level);
    }
  };

  const questions = useMemo(() => QUESTION_BANK[role] || QUESTION_BANK.general, [role]);
  const total = questions.length;
  const current = questions[Math.min(qIndex, total - 1)];

  useEffect(() => {
    setAiExtra(null);
    setAiExtraError(null);
  }, [qIndex, role, level]);

  const fetchAiHint = async () => {
    setAiExtraLoading(true);
    setAiExtraError(null);
    try {
      const roleLabel = ROLES.find((r) => r.value === role)?.label ?? role;
      const levelLabel = LEVELS.find((l) => l.value === level)?.label ?? level;
      const { data } = await publicToolsService.interviewHint({
        question: current.q,
        role: roleLabel,
        level: levelLabel,
      });
      if (data?.success && data.data) {
        setAiExtra(data.data);
      } else {
        throw new Error('bad response');
      }
    } catch {
      setAiExtraError('Không tải được gợi ý AI. Thử lại sau.');
    } finally {
      setAiExtraLoading(false);
    }
  };

  const applyConfig = () => {
    setRole(draftRole);
    setLevel(draftLevel);
    setQIndex(0);
    setSheetOpen(false);
  };

  const startSession = () => {
    setQIndex(0);
    setIsStarted(true);
  };

  const endSession = () => {
    setIsStarted(false);
    setQIndex(0);
  };

  const titleNode = (
    <>
      Luyện phỏng vấn với <span className="text-primary">AI</span>
    </>
  );

  return (
    <AIPublicToolShell
      kicker="HireBOT · Ứng viên"
      icon={User}
      title={titleNode}
      description="Luyện trả lời phỏng vấn tuyển dụng: chọn ngành và cấp độ, duyệt câu hỏi mẫu và xin gợi ý AI cho từng câu — giúp bạn tự tin trước vòng phỏng vấn doanh nghiệp."
    >
      <div className="mx-auto max-w-6xl">
        {!isStarted ? (
          <>
            <div className="mb-12 text-center">
              <div className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" onClick={startSession} className="gap-2">
                  Bắt đầu ngay <Play className="size-[18px]" fill="currentColor" aria-hidden />
                </Button>
                <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2" type="button">
                      <Settings2 className="size-[18px]" aria-hidden />
                      Cấu hình kịch bản
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>Cấu hình phiên luyện tập</SheetTitle>
                      <SheetDescription>
                        Chọn lĩnh vực và mức kinh nghiệm để lọc câu hỏi gần với vị trí bạn ứng
                        tuyển. Trong phiên luyện, bấm lấy gợi ý AI cho từng câu (cần dịch vụ AI hoạt
                        động).
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-1 flex-col gap-6 py-6">
                      <div className="space-y-2">
                        <Label htmlFor="interview-role">Lĩnh vực</Label>
                        <Select value={draftRole} onValueChange={(val) => setDraftRole(val)}>
                          <SelectTrigger
                            id="interview-role"
                            className="h-11 w-full rounded-xl border-border/60 bg-muted/50 px-3 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/20"
                          >
                            <SelectValue placeholder="Chọn lĩnh vực" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/50 shadow-xl">
                            {ROLES.map((r) => (
                              <SelectItem
                                key={r.value}
                                value={r.value}
                                className="text-sm font-medium py-3"
                              >
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interview-level">Mức độ</Label>
                        <Select value={draftLevel} onValueChange={(val) => setDraftLevel(val)}>
                          <SelectTrigger
                            id="interview-level"
                            className="h-11 w-full rounded-xl border-border/60 bg-muted/50 px-3 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/20"
                          >
                            <SelectValue placeholder="Chọn mức độ" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/50 shadow-xl">
                            {LEVELS.map((l) => (
                              <SelectItem
                                key={l.value}
                                value={l.value}
                                className="text-sm font-medium py-3"
                              >
                                {l.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <SheetFooter className="gap-2 sm:flex-col sm:space-x-0">
                      <Button type="button" className="w-full" onClick={applyConfig}>
                        Lưu & áp dụng
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
              <p className="text-base font-medium text-muted-foreground">
                Đang chọn:{' '}
                <span className="font-semibold text-foreground">
                  {ROLES.find((r) => r.value === role)?.label}
                </span>
                {' · '}
                <span className="font-semibold text-foreground">
                  {LEVELS.find((l) => l.value === level)?.label}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {FEATURES.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div key={idx} className="ai-tool-panel ai-tool-panel--lift p-8">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-6" strokeWidth={1.5} />
                    </div>
                    <h3 className="mb-3 text-lg font-bold text-foreground">{feat.title}</h3>
                    <p className="font-medium leading-relaxed text-muted-foreground">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="ai-tool-panel overflow-hidden">
            <div className="flex min-h-[560px] flex-col md:flex-row">
              <div className="relative flex flex-1 items-center justify-center bg-muted/30 p-8">
                <div className="flex flex-col items-center gap-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                    <Bot className="size-6" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-foreground">Trợ lý phỏng vấn</h4>
                    <p className="mt-1 text-base font-medium text-muted-foreground">
                      {ROLES.find((r) => r.value === role)?.label} ·{' '}
                      {LEVELS.find((l) => l.value === level)?.label}
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                      <span className="text-sm font-medium text-primary">
                        Sẵn sàng câu tiếp theo
                      </span>
                    </div>
                  </div>
                  <div className="flex h-40 w-40 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="size-20 text-primary/60" strokeWidth={1} />
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col border-t border-border/60 md:w-[min(100%,28rem)] md:border-l md:border-t-0">
                <div className="flex-1 overflow-y-auto p-8">
                  <span className="mb-4 inline-block rounded-lg bg-muted px-2.5 py-1 text-sm font-semibold text-muted-foreground">
                    Câu hỏi {qIndex + 1}/{total}
                  </span>
                  <h3 className="mb-6 text-xl font-bold leading-snug text-foreground">
                    &quot;{current.q}&quot;
                  </h3>
                  <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                    <p className="mb-2 text-base font-semibold uppercase tracking-normal text-primary">
                      Gợi ý khung trả lời
                    </p>
                    <p className="text-base font-medium leading-relaxed text-muted-foreground">
                      {current.hint}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-3 w-full gap-2 sm:w-auto"
                    disabled={aiExtraLoading}
                    onClick={fetchAiHint}
                  >
                    {aiExtraLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Đang tạo gợi ý AI…
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" aria-hidden />
                        Gợi ý thêm từ AI
                      </>
                    )}
                  </Button>
                  {aiExtraError && (
                    <p className="mt-2 text-base font-medium text-destructive" role="alert">
                      {aiExtraError}
                    </p>
                  )}
                  {aiExtra && (aiExtra.hints?.length > 0 || aiExtra.framework) && (
                    <div className="mt-4 space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                      {aiExtra.framework ? (
                        <div>
                          <p className="mb-1 text-base font-semibold uppercase tracking-normal text-muted-foreground">
                            Khung (AI)
                          </p>
                          <p className="text-base font-medium leading-relaxed text-foreground">
                            {aiExtra.framework}
                          </p>
                        </div>
                      ) : null}
                      {aiExtra.hints?.length > 0 ? (
                        <div>
                          <p className="mb-2 text-base font-semibold uppercase tracking-normal text-muted-foreground">
                            Gợi ý chi tiết
                          </p>
                          <ul className="list-disc space-y-1.5 pl-4 text-sm font-medium text-foreground/90">
                            {aiExtra.hints.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="border-t border-border/60 bg-muted/20 p-6">
                  <div className="mb-4 flex h-28 items-center justify-center rounded-xl bg-muted/50">
                    <User className="size-10 text-muted-foreground" aria-hidden />
                    <span className="sr-only">Khu vực camera / ghi âm (demo)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 gap-1 sm:flex-initial"
                      disabled={qIndex <= 0}
                      onClick={() => setQIndex((i) => Math.max(0, i - 1))}
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                      Trước
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 gap-1 sm:flex-initial"
                      disabled={qIndex >= total - 1}
                      onClick={() => setQIndex((i) => Math.min(total - 1, i + 1))}
                    >
                      Tiếp
                      <ChevronRight className="size-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive sm:ml-auto sm:w-auto"
                      onClick={endSession}
                    >
                      Kết thúc phiên
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border/60 px-6 py-4 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => setIsStarted(false)}
                className="font-medium text-primary transition-colors hover:text-primary/80"
              >
                Thoát về trang giới thiệu
              </button>
              <span className="hidden sm:inline">·</span>
              <button
                type="button"
                onClick={() => handleSheetOpenChange(true)}
                className="font-medium text-primary hover:text-primary/80"
              >
                Đổi kịch bản
              </button>
            </div>
          </div>
        )}
      </div>
    </AIPublicToolShell>
  );
};

export default AIInterviewPage;
