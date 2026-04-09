import React, { useState } from 'react';
import { CheckCircle2, RefreshCw, Sparkles, Wand2, Rocket, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Loading from '../../components/common/Loading';

const DEFAULT_PHASES = [
  {
    id: 1,
    title: 'Tối ưu Profile & Thương hiệu cá nhân',
    period: 'Tuần 1 - Tuần 2',
    status: 'completed',
    tasks: [
      { label: 'Cập nhật CV với các dự án mới nhất', done: true },
      { label: 'Tối ưu hóa Linkedin với từ khóa ngành', done: true },
    ],
    aiTip: 'Linkedin của bạn đã nhận được thêm 15 lượt xem sau khi cập nhật tiêu đề mới.',
  },
  {
    id: 2,
    title: 'Xây dựng mạng lưới & Tìm kiếm',
    period: 'Tuần 3 - Tuần 4',
    status: 'in_progress',
    tasks: [
      { label: 'Kết nối với 10 chuyên gia cùng lĩnh vực', done: 6, total: 10 },
      { label: 'Ứng tuyển ít nhất 5 công việc mục tiêu', done: 0, total: 5 },
    ],
    aiStrategy:
      'Dựa trên kỹ năng Figma của bạn, AI gợi ý bạn nên tìm kiếm các vị trí "Product Designer" tại các công ty Fintech đang tuyển dụng gấp như MB Bank hoặc MoMo.',
  },
  {
    id: 3,
    title: 'Chiến dịch phỏng vấn',
    period: 'Tuần 5 - Tuần 8',
    status: 'not_started',
    tasks: [
      { label: 'Luyện tập trả lời phỏng vấn STAR', done: false },
      { label: 'Tham gia 3 buổi phỏng vấn thử (Mock Interview)', done: false },
    ],
  },
  {
    id: 4,
    title: 'Đàm phán & Onboarding',
    period: 'Tuần 9 - Tuần 12',
    status: 'not_started',
    tasks: [],
  },
];

const CareerRoadmapPage = () => {
  const [loading, setLoading] = useState(true);
  const [phases] = useState(DEFAULT_PHASES);

  const startDate = '01/10/2026';
  const daysLeft = 70;
  const overallProgress = 22;
  const daysDone = 20;

  // Simulate initial loading (replace with actual API call if needed)
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loading size="xl" text="Đang tải lộ trình..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Lộ trình 90 Ngày</h1>
            <p className="text-sm text-muted-foreground">Chinh phục sự nghiệp mơ ước</p>
          </div>
        </div>
      </div>

      {/* KẾ HOẠCH HIỆN TẠI */}
      <Card className="rounded-xl border bg-card shadow-sm">
        <CardContent className="p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Kế hoạch hiện tại
          </p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Product Designer - Senior Level
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Khởi đầu từ ngày {startDate} - Còn {daysLeft} ngày nữa
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              AI gợi ý: Cập nhật Portfolio ngay!
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-medium text-foreground">Tiến độ tổng thể</p>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={overallProgress} className="h-3 flex-1" />
              <span className="text-sm font-semibold text-foreground">
                {overallProgress}% ({daysDone}/90 ngày)
              </span>
            </div>
            <p className="mt-2 text-sm italic text-muted-foreground">
              Bạn đang nhanh hơn 5% so với mục tiêu đề ra. Giữ vững phong độ nhé!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Các giai đoạn chính */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-foreground">Các giai đoạn chính</h2>
        <div className="space-y-6">
          {phases.map((phase) => (
            <Card key={phase.id} className="rounded-xl border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                        phase.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-600'
                          : phase.status === 'in_progress'
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {phase.status === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : phase.status === 'in_progress' ? (
                        <RefreshCw className="h-6 w-6" />
                      ) : (
                        <Sparkles className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{phase.title}</h3>
                      <p className="text-sm text-muted-foreground">{phase.period}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      phase.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : phase.status === 'in_progress'
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {phase.status === 'completed'
                      ? 'HOÀN THÀNH'
                      : phase.status === 'in_progress'
                        ? 'ĐANG LÀM'
                        : 'CHƯA BẮT ĐẦU'}
                  </span>
                </div>

                {phase.tasks && phase.tasks.length > 0 && (
                  <ul className="mt-6 space-y-3">
                    {phase.tasks.map((task, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        {typeof task.done === 'boolean' ? (
                          task.done ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                          ) : (
                            <span className="h-5 w-5 shrink-0 rounded border-2 border-muted" />
                          )
                        ) : (
                          <span className="shrink-0 text-muted-foreground">
                            Đã hoàn thành {task.done}/{task.total}
                          </span>
                        )}
                        <span className="text-foreground">{task.label}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {phase.aiTip && (
                  <div className="mt-4 flex gap-3 rounded-lg bg-primary/5 p-4">
                    <Lightbulb className="h-5 w-5 shrink-0 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Gợi ý AI: </span>
                      {phase.aiTip}
                    </p>
                  </div>
                )}

                {phase.aiStrategy && (
                  <div className="mt-4 flex gap-3 rounded-lg bg-primary/5 p-4">
                    <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Chiến lược AI đề xuất</p>
                      <p className="mt-1 text-sm text-muted-foreground">{phase.aiStrategy}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Card className="overflow-hidden rounded-xl border-0 bg-gradient-to-r from-primary to-[#0d9488] text-white">
        <CardContent className="flex flex-wrap items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Wand2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Bạn muốn AI điều chỉnh lộ trình?</h3>
              <p className="mt-1 text-sm text-white/90">
                Tôi có thể tối ưu hóa các bước dựa trên phản hồi từ nhà tuyển dụng.
              </p>
            </div>
          </div>
          <Button className="rounded-lg bg-white text-[#0d9488] hover:bg-white/90">
            Yêu cầu AI điều chỉnh
          </Button>
        </CardContent>
      </Card>

      <footer className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Career Roadmap Planner. Powered by AI Intelligence.
      </footer>
    </div>
  );
};

export default CareerRoadmapPage;
