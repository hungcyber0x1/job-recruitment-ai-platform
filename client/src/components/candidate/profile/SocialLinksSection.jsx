import React, { useState } from 'react';
import { Globe, Linkedin, Github, ExternalLink, Check, Save, X } from 'lucide-react';
import { cn } from '@/utils/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const SocialLinksSection = ({ social_links = {}, onSave, loading }) => {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    linkedin: social_links.linkedin || '',
    github: social_links.github || '',
    portfolio: social_links.portfolio || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isEmpty = !form.linkedin && !form.github && !form.portfolio;
  const hasChanges =
    JSON.stringify(form) !==
    JSON.stringify({
      linkedin: social_links.linkedin || '',
      github: social_links.github || '',
      portfolio: social_links.portfolio || '',
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      setSaved(true);
    } catch (err) {
      console.error('Failed to save social links', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Liên kết mạng xã hội</h3>
          <p className="text-sm text-muted-foreground mt-0.5">LinkedIn, GitHub và hồ sơ dự án</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="h-8 text-xs text-muted-foreground"
        >
          {expanded ? 'Thu gọn' : 'Mở rộng'}
        </Button>
      </div>

      {expanded && (
        <div className="space-y-4">
          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:shadow-sm transition-shadow">
              <div className="w-10 h-12 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center shrink-0">
                <Linkedin className="h-5 w-5 text-[#0A66C2]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500">LinkedIn</p>
                {form.linkedin ? (
                  <a
                    href={form.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium truncate block"
                  >
                    {form.linkedin.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 italic">Chưa thêm</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:shadow-sm transition-shadow">
              <div className="w-10 h-12 rounded-xl bg-slate-800/10 flex items-center justify-center shrink-0">
                <Github className="h-5 w-5 text-slate-800" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500">GitHub</p>
                {form.github ? (
                  <a
                    href={form.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-700 hover:text-slate-900 font-medium truncate block"
                  >
                    {form.github.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 italic">Chưa thêm</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:shadow-sm transition-shadow">
              <div className="w-10 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ExternalLink className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500">Hồ sơ dự án</p>
                {form.portfolio ? (
                  <a
                    href={form.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium truncate block"
                  >
                    {form.portfolio.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <p className="text-xs text-slate-400 italic">Chưa thêm</p>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
                URL LinkedIn
              </Label>
              <Input
                type="url"
                value={form.linkedin}
                onChange={(e) => {
                  setForm((f) => ({ ...f, linkedin: e.target.value }));
                  setSaved(false);
                }}
                placeholder="https://linkedin.com/in/nguyen-van-a"
                className="h-12 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5 text-slate-800" />
                URL GitHub
              </Label>
              <Input
                type="url"
                value={form.github}
                onChange={(e) => {
                  setForm((f) => ({ ...f, github: e.target.value }));
                  setSaved(false);
                }}
                placeholder="https://github.com/nguyenvana"
                className="h-12 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-emerald-600" />
                URL hồ sơ dự án
              </Label>
              <Input
                type="url"
                value={form.portfolio}
                onChange={(e) => {
                  setForm((f) => ({ ...f, portfolio: e.target.value }));
                  setSaved(false);
                }}
                placeholder="https://hoso.nguyenvana.dev"
                className="h-12 rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              {saved && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="h-3 w-3" /> Đã lưu
                </span>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="h-8 gap-1.5 rounded-lg bg-emerald-600 text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Lưu liên kết
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialLinksSection;
