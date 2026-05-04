import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lightbulb,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import interviewPrepService from '../../services/interviewPrepService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const SAMPLE_QUESTIONS = {
  general: [
    'Hãy giới thiệu về bản thân bạn trong vòng 2 phút.',
    'Điểm mạnh và điểm yếu của bạn là gì?',
    'Tại sao bạn muốn làm việc tại công ty này?',
    'Bạn định hướng sự nghiệp 5 năm tới như thế nào?',
    'Mức lương mong muốn của bạn là bao nhiêu?',
  ],
  technical: [
    'Bạn có thể giải thích một khái niệm kỹ thuật quan trọng không?',
    'Mô tả một dự án thách thức nhất bạn đã làm.',
    'Bạn xử lý mâu thuẫn trong nhóm như thế nào?',
    'Khi nào bạn chọn công nghệ A thay vì công nghệ B?',
    'Làm sao để gỡ lỗi một lỗi phức tạp?',
  ],
  behavioral: [
    'Kể về một lần bạn thất bại và cách bạn xử lý.',
    'Mô tả tình huống bạn phải làm việc dưới áp lực.',
    'Bạn đã thuyết phục đồng nghiệp thay đổi quan điểm như thế nào?',
    'Kể về một mục tiêu bạn đã đạt được trong công việc.',
    'Bạn tiếp nhận phản hồi tiêu cực như thế nào?',
  ],
};

const TYPE_CONFIG = {
  general: {
    label: 'Chung',
    helper: 'Mở đầu, động lực, mục tiêu',
    icon: MessageSquare,
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    iconBox: 'bg-sky-50 text-sky-600 ring-sky-100',
    accent: 'bg-sky-500',
  },
  technical: {
    label: 'Kỹ thuật',
    helper: 'Dự án, tư duy, chuyên môn',
    icon: Brain,
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    iconBox: 'bg-violet-50 text-violet-600 ring-violet-100',
    accent: 'bg-violet-500',
  },
  behavioral: {
    label: 'Hành vi',
    helper: 'STAR, làm việc nhóm, áp lực',
    icon: ShieldCheck,
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    iconBox: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    accent: 'bg-emerald-500',
  },
};

const PREP_TIPS = [
  'Nghiên cứu kỹ bản mô tả công việc và chọn 3 yêu cầu quan trọng nhất để chuẩn bị ví dụ.',
  'Chuẩn bị 3-5 câu chuyện thành tựu có số liệu, bối cảnh và kết quả rõ ràng.',
  'Dùng phương pháp STAR cho câu hỏi hành vi: Tình huống, Nhiệm vụ, Hành động, Kết quả.',
  'Chuẩn bị 2-3 câu hỏi thông minh về nhóm, quy trình và kỳ vọng sau 90 ngày.',
  'Kiểm tra camera, micro và tài liệu trước buổi phỏng vấn ít nhất 15 phút.',
];

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.general;
}

const NoteSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="p-5">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-2.5">
          <div className="h-5 w-2/3 rounded bg-slate-100 animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-slate-100 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-slate-50 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

const EmptyNotes = ({ searching, onCreate, onReset }) => (
  <Card className="rounded-lg border-dashed border-slate-300 bg-white shadow-sm">
    <CardContent className="px-6 py-14 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100">
        <BookOpen className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-800">
        {searching ? 'Không tìm thấy ghi chú nào' : 'Chưa có ghi chú nào'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500">
        {searching
          ? 'Thử đổi từ khóa hoặc xóa tìm kiếm để xem toàn bộ ghi chú luyện phỏng vấn.'
          : 'Tạo ghi chú nghiên cứu công ty, câu hỏi cần luyện và chiến lược cho từng buổi phỏng vấn.'}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        {searching ? (
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="rounded-lg px-5 font-bold"
          >
            Xóa tìm kiếm
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onCreate}
            className="rounded-lg bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm ghi chú đầu tiên
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

const NoteCard = ({ note, onEdit, onDelete, deleting }) => {
  const config = getTypeConfig(note.type);
  const TypeIcon = config.icon;

  return (
    <article className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/40">
      <div className={cn('absolute inset-y-0 left-0 w-1', config.accent)} />
      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => onEdit(note)}
            className="flex min-w-0 flex-1 gap-4 text-left"
          >
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
                config.iconBox
              )}
            >
              <TypeIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="line-clamp-1 text-base font-bold text-slate-950 group-hover:text-emerald-700">
                  {note.title || 'Ghi chú chưa có tiêu đề'}
                </h3>
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
                    config.badge
                  )}
                >
                  {config.label}
                </span>
                {note.pinned && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
                    <Star className="h-3 w-3" />
                    Ghim
                  </span>
                )}
              </div>

              {note.company && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Target className="h-3.5 w-3.5 text-slate-400" />
                  {note.company}
                </p>
              )}

              {note.content && (
                <p className="mt-3 line-clamp-3 text-sm font-medium leading-relaxed text-slate-600">
                  {note.content}
                </p>
              )}

              <p className="mt-3 text-xs font-medium text-slate-400">
                {formatDate(note.updated_at || note.created_at)}
              </p>
            </div>
          </button>

          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => onEdit(note)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label="Sửa ghi chú"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(note)}
              disabled={deleting}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
              aria-label="Xóa ghi chú"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const QuestionCategory = ({ type, questions }) => {
  const config = getTypeConfig(type);
  const TypeIcon = config.icon;

  return (
    <Card className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
      <div className={cn('h-1', config.accent)} />
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
              config.iconBox
            )}
          >
            <TypeIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-950">{config.label}</h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{config.helper}</p>
          </div>
        </div>

        <ol className="mt-5 space-y-3">
          {questions.map((question, index) => (
            <li
              key={question}
              className="flex gap-3 text-sm font-medium leading-relaxed text-slate-600"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500">
                {index + 1}
              </span>
              <span>{question}</span>
            </li>
          ))}
        </ol>

        <Button variant="outline" asChild className="mt-5 h-10 w-full rounded-lg text-sm font-bold">
          <Link to="/candidate/chat">
            <Brain className="mr-2 h-4 w-4 text-violet-600" />
            Luyện tập với AI
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const PrepTips = () => (
  <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
    <CardContent className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-950">Mẹo chuẩn bị phỏng vấn</h3>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Các nguyên tắc nhỏ nhưng tạo khác biệt lớn.
          </p>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {PREP_TIPS.map((tip) => (
          <li key={tip} className="flex gap-3 text-sm font-medium leading-relaxed text-slate-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const InterviewPrepPage = () => {
  const { showNotification } = useNotification();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    company: '',
    type: 'general',
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await interviewPrepService.getNotes();
      setNotes(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const openCreateNote = () => {
    setNoteForm({ title: '', content: '', company: '', type: 'general' });
    setEditingNote(null);
    setShowNoteDialog(true);
  };

  const openEditNote = (note) => {
    setNoteForm({
      title: note.title || '',
      content: note.content || '',
      company: note.company || '',
      type: note.type || 'general',
    });
    setEditingNote(note);
    setShowNoteDialog(true);
  };

  const handleSaveNote = async () => {
    if (!noteForm.title.trim()) {
      showNotification('Vui lòng nhập tiêu đề.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingNote) {
        await interviewPrepService.updateNote(editingNote.id, noteForm);
        setNotes((prev) =>
          prev.map((note) => (note.id === editingNote.id ? { ...note, ...noteForm } : note))
        );
        showNotification('Đã cập nhật ghi chú.', 'success');
      } else {
        const res = await interviewPrepService.saveNote(noteForm);
        setNotes((prev) => [res.data?.data || { ...noteForm, id: Date.now() }, ...prev]);
        showNotification('Đã lưu ghi chú.', 'success');
      }
      setShowNoteDialog(false);
    } catch (err) {
      showNotification('Không lưu được.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (note) => {
    if (!window.confirm(`Xóa ghi chú "${note.title}"?`)) return;
    setDeletingId(note.id);
    try {
      await interviewPrepService.deleteNote(note.id);
      setNotes((prev) => prev.filter((item) => item.id !== note.id));
      showNotification('Đã xóa ghi chú.', 'success');
    } catch (err) {
      showNotification('Không xóa được.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredNotes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter(
      (note) =>
        (note.title || '').toLowerCase().includes(query) ||
        (note.company || '').toLowerCase().includes(query)
    );
  }, [notes, searchTerm]);

  const noteStats = useMemo(() => {
    const companies = new Set(notes.map((note) => note.company).filter(Boolean));
    return {
      total: notes.length,
      companies: companies.size,
      technical: notes.filter((note) => note.type === 'technical').length,
      pinned: notes.filter((note) => note.pinned).length,
    };
  }, [notes]);

  const isSearching = Boolean(searchTerm.trim());

  return (
    <div className="min-h-screen bg-transparent pb-16">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
                <GraduationCap className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  Trung tâm luyện tập
                </span>
                <h1 className="mt-3 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
                  Trung tâm luyện phỏng vấn
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
                  Ghi chú nghiên cứu công ty, câu hỏi đã luyện tập và chiến lược cho từng buổi phỏng
                  vấn.
                </p>
              </div>
            </div>

            <Button
              onClick={openCreateNote}
              className="h-11 rounded-lg bg-emerald-600 px-5 font-bold text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm ghi chú
            </Button>
          </div>

          {!loading && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={FileText}
                label="Ghi chú"
                value={noteStats.total}
                helper="Tài liệu đã lưu"
                tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
              />
              <StatCard
                icon={Briefcase}
                label="Công ty"
                value={noteStats.companies}
                helper="Đã nghiên cứu"
                tone="bg-sky-50 text-sky-600 ring-sky-100"
              />
              <StatCard
                icon={Brain}
                label="Kỹ thuật"
                value={noteStats.technical}
                helper="Câu hỏi chuyên môn"
                tone="bg-violet-50 text-violet-600 ring-violet-100"
              />
              <StatCard
                icon={Star}
                label="Ghim"
                value={noteStats.pinned}
                helper="Ưu tiên ôn lại"
                tone="bg-amber-50 text-amber-600 ring-amber-100"
              />
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <section className="space-y-4">
          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Tìm ghi chú theo tiêu đề, công ty..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="h-12 rounded-lg border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium shadow-none transition-colors focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="text-sm font-medium text-slate-500">
                  Hiển thị <span className="font-bold text-slate-800">{filteredNotes.length}</span>
                  {filteredNotes.length !== notes.length && (
                    <>
                      {' '}
                      trong <span className="font-bold text-slate-800">{notes.length}</span> ghi chú
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <NoteSkeleton key={item} />
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <EmptyNotes
              searching={isSearching}
              onCreate={openCreateNote}
              onReset={() => setSearchTerm('')}
            />
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={openEditNote}
                  onDelete={handleDeleteNote}
                  deleting={deletingId === note.id}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Câu hỏi phỏng vấn mẫu</h2>
              <p className="mt-0.5 text-sm font-medium text-slate-500">
                Chọn nhóm câu hỏi để luyện tập.
              </p>
            </div>
            <Lightbulb className="h-5 w-5 text-amber-500" />
          </div>

          {Object.entries(SAMPLE_QUESTIONS).map(([type, questions]) => (
            <QuestionCategory key={type} type={type} questions={questions} />
          ))}

          <PrepTips />
        </aside>
      </main>

      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              {editingNote ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú phỏng vấn'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tiêu đề *</Label>
              <Input
                placeholder="VD: Research trước phỏng vấn FPT Software"
                value={noteForm.title}
                onChange={(event) =>
                  setNoteForm((prev) => ({ ...prev, title: event.target.value }))
                }
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Công ty</Label>
              <Input
                placeholder="VD: FPT Software"
                value={noteForm.company}
                onChange={(event) =>
                  setNoteForm((prev) => ({ ...prev, company: event.target.value }))
                }
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Loại</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TYPE_CONFIG).map(([value, config]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNoteForm((prev) => ({ ...prev, type: value }))}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-center text-sm font-bold transition-colors',
                      noteForm.type === value
                        ? cn('border-transparent ring-1 ring-inset', config.badge)
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                    )}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nội dung</Label>
              <Textarea
                placeholder="Ghi chú nghiên cứu, câu hỏi dự định hỏi, điểm cần chú ý..."
                rows={6}
                value={noteForm.content}
                onChange={(event) =>
                  setNoteForm((prev) => ({ ...prev, content: event.target.value }))
                }
                className="rounded-lg"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowNoteDialog(false)}
              className="rounded-lg font-bold"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={saving || !noteForm.title.trim()}
              className="rounded-lg bg-emerald-600 font-bold text-white hover:bg-emerald-700"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? 'Đang lưu...' : editingNote ? 'Cập nhật' : 'Lưu ghi chú'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewPrepPage;
