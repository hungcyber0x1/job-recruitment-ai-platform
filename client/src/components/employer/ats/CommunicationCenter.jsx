import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  CalendarPlus,
  XCircle,
  Award,
  FileText,
  Loader2,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotification } from '../../../context/NotificationContext';
import employerEmailService from '../../../services/employerEmailService';
import { cn } from '@/utils/cn';

const EMAIL_TEMPLATES = {
  interview: {
    type: 'interview',
    icon: CalendarPlus,
    label: 'Mời phỏng vấn',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    subject: 'Lời mời phỏng vấn tại {{company_name}}',
    body: `Kính gửi {{candidate_name}},

Cảm ơn bạn đã quan tâm đến vị trí {{job_title}} tại {{company_name}}.

Sau khi xem xét hồ sơ của bạn, chúng tôi rất ấn tượng và muốn mời bạn tham gia vòng phỏng vấn.

📅 Thời gian: {{interview_date}} lúc {{interview_time}}
📍 Địa điểm: {{interview_location}}

{{interview_notes}}

Xin vui lòng xác nhận sự tham gia trong vòng 24 giờ.

Trân trọng,
{{company_name}}`,
  },
  rejection: {
    type: 'rejection',
    icon: XCircle,
    label: 'Thư từ chối',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    subject: 'Cập nhật đơn ứng tuyển - {{job_title}}',
    body: `Kính gửi {{candidate_name}},

Cảm ơn bạn đã dành thời gian ứng tuyển vị trí {{job_title}} tại {{company_name}}.

Sau quá trình cân nhắc kỹ lưỡng, chúng tôi rất tiếc phải thông báo rằng chúng tôi quyết định tiếp tục với các ứng viên khác phù hợp hơn với vị trí này.

Đây không phản ánh năng lực của bạn. Chúng tôi rất vui lòng được liên hệ lại nếu có cơ hội phù hợp trong tương lai.

Chúc bạn thành công trong sự nghiệp!

Trân trọng,
{{company_name}}`,
  },
  offer: {
    type: 'offer',
    icon: Award,
    label: 'Gửi Offer',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    subject: 'Đề nghị việc làm - {{job_title}} tại {{company_name}}',
    body: `Kính gửi {{candidate_name}},

Chúng tôi vui mừng thông báo rằng {{company_name}} muốn mời bạn gia nhập đội ngũ của chúng tôi với vị trí {{job_title}}.

💰 Mức lương: {{offer_salary}}
📅 Ngày bắt đầu: {{offer_start_date}}
⏰ Hạn chót xác nhận: {{offer_deadline}}

Chi tiết hợp đồng sẽ được gửi kèm trong email tiếp theo.

Xin vui lòng phản hồi trước hạn chót để xác nhận với chúng tôi.

Chào mừng đến với {{company_name}}!

Trân trọng,
{{company_name}}`,
  },
};

const CommunicationCenter = ({ applicationId, candidateName, jobTitle, onClose }) => {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('send');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('interview');
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    body: '',
  });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyRes, templatesRes] = await Promise.allSettled([
          employerEmailService.getEmailHistory({ limit: 20 }),
          employerEmailService.getTemplates(),
        ]);
        if (historyRes.status === 'fulfilled') {
          setHistory(historyRes.value.data?.data || []);
        }
        if (templatesRes.status === 'fulfilled') {
          setTemplates(templatesRes.value.data?.data || []);
        }
      } catch (err) {
        console.error('Failed to load communication data:', err);
      }
    };
    loadData();
  }, []);

  const handleSelectTemplate = (type) => {
    setSelectedTemplate(type);
    const tpl = EMAIL_TEMPLATES[type];
    if (tpl) {
      setEmailForm({
        to: candidateName || '',
        subject: tpl.subject,
        body: tpl.body,
      });
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.body) {
      showNotification('Vui lòng điền đầy đủ thông tin email.', 'error');
      return;
    }
    setLoading(true);
    try {
      await employerEmailService.sendCustomEmail({
        to: emailForm.to,
        subject: emailForm.subject,
        body: emailForm.body,
        application_id: applicationId,
      });
      showNotification('Đã gửi email thành công!', 'success');
      setEmailForm({ to: '', subject: '', body: '' });
      setActiveTab('history');
    } catch (err) {
      console.error('Send failed:', err);
      showNotification('Không thể gửi email. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentTemplate = EMAIL_TEMPLATES[selectedTemplate];
  const TemplateIcon = currentTemplate?.icon || Mail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
            <Mail className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Trung tâm liên lạc</h2>
            <p className="text-sm text-slate-500">Gửi email, mời phỏng vấn, offer</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-lg">
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="send" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Gửi Email
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Mẫu có sẵn
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Lịch sử
          </TabsTrigger>
        </TabsList>

        {/* Send Email Tab */}
        <TabsContent value="send" className="mt-4 space-y-4">
          {/* Quick template buttons */}
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(EMAIL_TEMPLATES).map(([key, tpl]) => {
              const Icon = tpl.icon;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectTemplate(key)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                    selectedTemplate === key
                      ? `${tpl.border} ${tpl.bg} border-2`
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  )}
                >
                  <Icon className={cn('h-6 w-6', tpl.color)} />
                  <span className="text-xs font-bold text-slate-700">{tpl.label}</span>
                </button>
              );
            })}
          </div>

          {/* Email form */}
          <Card className="rounded-xl border border-slate-100 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Người nhận</label>
                <Input
                  value={emailForm.to}
                  onChange={e => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="Tên ứng viên hoặc email"
                  className="rounded-xl h-11"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Chủ đề</label>
                <Input
                  value={emailForm.subject}
                  onChange={e => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Subject..."
                  className="rounded-xl h-11"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1 block">Nội dung</label>
                <textarea
                  value={emailForm.body}
                  onChange={e => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                  rows={12}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
                  placeholder="Nội dung email..."
                />
              </div>

              {/* Placeholders hint */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs font-bold text-slate-500 mb-2">Biến có thể dùng:</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(employerEmailService.getTemplatePlaceholders()).map(([key, label]) => (
                    <span
                      key={key}
                      className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-xs font-mono text-slate-500"
                    >
                      {`{{${key}}}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Xem trước
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 h-11"
                  onClick={handleSendEmail}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Gửi email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          {Object.entries(EMAIL_TEMPLATES).map(([key, tpl]) => {
            const Icon = tpl.icon;
            return (
              <Card
                key={key}
                className={cn('rounded-xl border shadow-sm overflow-hidden cursor-pointer transition-all', tpl.border)}
                onClick={() => { setSelectedTemplate(key); setActiveTab('send'); handleSelectTemplate(key); }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', tpl.bg)}>
                        <Icon className={cn('h-5 w-5', tpl.color)} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{tpl.label}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{tpl.subject}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-lg">
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Sử dụng
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-slate-400 line-clamp-3 font-mono">
                    {tpl.body.slice(0, 200)}...
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-white">
                  <div className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                    item.status === 'sent' ? 'bg-emerald-50' : 'bg-red-50'
                  )}>
                    {item.status === 'sent' ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.subject || 'Email'}</p>
                    <p className="text-xs text-slate-500">Gửi đến: {item.to || '—'}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.sent_at ? new Date(item.sent_at).toLocaleString('vi-VN') : '—'}
                    </p>
                  </div>
                  <Badge variant={item.status === 'sent' ? 'success' : 'error'} className="shrink-0">
                    {item.status === 'sent' ? 'Đã gửi' : 'Thất bại'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">Chưa có email nào được gửi</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle>Xem trước email</DialogTitle>
            <DialogDescription>
              Đây là nội dung email sẽ được gửi đến ứng viên.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-slate-200 bg-white p-6 max-h-96 overflow-y-auto">
            <p className="text-sm font-bold text-slate-700 mb-4">Đến: {emailForm.to}</p>
            <p className="text-sm font-bold text-slate-900 mb-4 pb-4 border-b border-slate-100">
              {emailForm.subject}
            </p>
            <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
              {emailForm.body}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)} className="rounded-xl">
              Đóng
            </Button>
            <Button
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600"
              onClick={() => { setShowPreview(false); handleSendEmail(); }}
              disabled={loading}
            >
              <Send className="h-4 w-4 mr-2" />
              Gửi ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunicationCenter;
