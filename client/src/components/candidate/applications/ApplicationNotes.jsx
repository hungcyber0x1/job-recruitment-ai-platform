import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Save,
  Trash2,
  Edit2,
  X,
  Loader2,
  AlertCircle,
  StickyNote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import applicationNoteService from '../../../services/applicationNoteService';
import { useNotification } from '../../../context/NotificationContext';

const ApplicationNotes = ({ applicationId, initialNote = '', onNoteSaved }) => {
  const { showNotification } = useNotification();
  const [note, setNote] = useState(initialNote);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasNote, setHasNote] = useState(Boolean(initialNote));
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadNote = async () => {
      try {
        const response = await applicationNoteService.getNote(applicationId);
        if (cancelled) return;
        const storedNote = response.data?.data?.note;
        const nextNote = storedNote || initialNote || '';
        setNote(nextNote);
        setHasNote(Boolean(nextNote));
      } catch {
        if (cancelled) return;
        setNote(initialNote);
        setHasNote(Boolean(initialNote));
      }
    };

    loadNote();
    return () => {
      cancelled = true;
    };
  }, [initialNote, applicationId]);

  const handleSave = async () => {
    if (!note.trim()) {
      showNotification('Vui lòng nhập nội dung ghi chú.', 'error');
      return;
    }
    setSaving(true);
    try {
      await applicationNoteService.saveNote(applicationId, { note });
      setHasNote(true);
      setShowForm(false);
      showNotification('Đã lưu ghi chú.', 'success');
      if (onNoteSaved) onNoteSaved(note);
    } catch (err) {
      console.warn('ApplicationNotes save error:', err?.message);
      showNotification('Không lưu được ghi chú.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa ghi chú này?')) return;
    setLoading(true);
    try {
      await applicationNoteService.deleteNote(applicationId);
      setNote('');
      setHasNote(false);
      setShowForm(false);
      showNotification('Đã xóa ghi chú.', 'success');
      if (onNoteSaved) onNoteSaved('');
    } catch (err) {
      showNotification('Không xóa được.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-bold text-foreground flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-amber-500" />
          Ghi chú cá nhân
        </h4>
        {!showForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(true)}
            className="h-8 rounded-lg text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
          >
            {hasNote ? (
              <Edit2 className="h-3.5 w-3.5" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5" />
            )}
            {hasNote ? 'Sửa ghi chú' : 'Thêm ghi chú'}
          </Button>
        )}
      </div>

      {/* Existing note display */}
      {hasNote && !showForm && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <StickyNote className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{note}</p>
          </div>
        </div>
      )}

      {/* Note form */}
      {showForm && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Ghi chú này chỉ hiển thị với bạn — nhà tuyển dụng không thấy.</span>
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Đây là công ty mơ ước, nhớ follow up sau 3 ngày. Đã research kỹ về tech stack..."
            rows={4}
            className="resize-none rounded-lg border-amber-200 bg-white text-sm focus:border-amber-400 focus:ring-amber-100"
          />
          <div className="flex items-center justify-between">
            {hasNote && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
                className="h-8 rounded-lg text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa ghi chú
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setNote(initialNote);
                }}
                className="h-8 rounded-lg text-xs font-bold gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !note.trim()}
                className="h-8 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 gap-1"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Lưu ghi chú
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasNote && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl border-2 border-dashed border-slate-200 p-4 text-center text-sm text-slate-400 hover:border-amber-300 hover:text-amber-500 transition-colors"
        >
          <MessageSquare className="h-5 w-5 mx-auto mb-1" />
          Thêm ghi chú cho đơn ứng tuyển này
        </button>
      )}
    </div>
  );
};

export default ApplicationNotes;
