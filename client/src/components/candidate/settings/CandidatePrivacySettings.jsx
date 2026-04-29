import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Shield,
  Search,
  Lock,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useNotification } from '../../../context/NotificationContext';
import privacyService from '../../../services/privacyService';
import { cn } from '@/utils';

const VISIBLE_FIELDS = [
  { key: 'skills', label: 'Kỹ năng', description: 'Cho phép nhà tuyển dụng xem danh sách kỹ năng' },
  { key: 'experience', label: 'Kinh nghiệm', description: 'Hiển thị lịch sử công việc' },
  { key: 'education', label: 'Học vấn', description: 'Hiển thị thông tin học vấn' },
  { key: 'certifications', label: 'Chứng chỉ', description: 'Hiển thị chứng chỉ và bằng cấp' },
  { key: 'portfolio', label: 'Hồ sơ dự án', description: 'Hiển thị liên kết dự án, GitHub' },
  { key: 'phone', label: 'Số điện thoại', description: 'Hiển thị số điện thoại cho nhà tuyển dụng' },
  { key: 'salary_expectation', label: 'Lương kỳ vọng', description: 'Hiển thị mức lương mong muốn' },
];

const CandidatePrivacySettings = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    profile_visible_to_recruiters: false,
    show_cv_to_recruiters: true,
    allow_recruiter_messages: true,
    show_applications_public: false,
    visible_fields: ['skills', 'experience', 'education'],
    last_updated: null,
  });
  const [accessLogs, setAccessLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [privacyRes, logsRes] = await Promise.allSettled([
          privacyService.getPrivacySettings(),
          privacyService.getCvAccessLogs({ limit: 10 }),
        ]);
        if (privacyRes.status === 'fulfilled') {
          setSettings(prev => ({ ...prev, ...(privacyRes.value.data?.data || {}) }));
        }
        if (logsRes.status === 'fulfilled') {
          setAccessLogs(logsRes.value.data?.data || []);
        }
      } catch (err) {
        console.warn('Failed to load privacy settings:', err?.message);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleToggle = async (key) => {
    const newValue = !settings[key];
    setSaving(true);
    try {
      await privacyService.updatePrivacySettings({ [key]: newValue });
      setSettings(prev => ({ ...prev, [key]: newValue }));
      showNotification('Đã cập nhật cài đặt!', 'success');
    } catch (err) {
      console.warn('Failed to update privacy setting:', err?.message);
      showNotification('Không thể cập nhật. Vui lòng thử lại.', 'error');
      setSettings(prev => ({ ...prev, [key]: !newValue }));
    } finally {
      setSaving(false);
    }
  };

  const handleFieldToggle = async (fieldKey) => {
    const currentFields = settings.visible_fields || [];
    const newFields = currentFields.includes(fieldKey)
      ? currentFields.filter(f => f !== fieldKey)
      : [...currentFields, fieldKey];

    setSaving(true);
    try {
      await privacyService.updateFieldVisibility(newFields);
      setSettings(prev => ({ ...prev, visible_fields: newFields }));
      showNotification('Đã cập nhật hiển thị trường!', 'success');
    } catch (err) {
      console.warn('Failed to update field visibility:', err?.message);
      showNotification('Không thể cập nhật. Vui lòng thử lại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
          <Shield className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Quyền riêng tư</h2>
          <p className="text-sm text-slate-500">Kiểm soát ai có thể xem thông tin của bạn</p>
        </div>
      </div>

      {/* Main Toggle Card */}
      <Card className="rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
          <div className="flex items-center gap-3">
            {settings.profile_visible_to_recruiters ? (
              <Eye className="h-8 w-8 text-white/80" />
            ) : (
              <EyeOff className="h-8 w-8 text-white/80" />
            )}
            <div>
              <h3 className="text-xl font-bold">
                {settings.profile_visible_to_recruiters ? 'Hồ sơ công khai' : 'Hồ sơ ẩn'}
              </h3>
              <p className="text-sm text-white/80 mt-1">
                {settings.profile_visible_to_recruiters
                  ? 'Nhà tuyển dụng có thể tìm thấy bạn khi tìm kiếm ứng viên'
                  : 'Chỉ nhà tuyển dụng từ việc bạn ứng tuyển mới thấy hồ sơ'}
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-bold text-slate-800">Cho phép tìm kiếm</p>
                <p className="text-xs text-slate-400">Nhà tuyển dụng có thể tìm thấy hồ sơ của bạn</p>
              </div>
            </div>
            <Switch
              checked={settings.profile_visible_to_recruiters}
              onCheckedChange={() => handleToggle('profile_visible_to_recruiters')}
              disabled={saving}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="font-bold text-slate-800">Hiển thị CV</p>
                  <p className="text-xs text-slate-400">Cho phép nhà tuyển dụng xem CV của bạn</p>
                </div>
              </div>
              <Switch
                checked={settings.show_cv_to_recruiters}
                onCheckedChange={() => handleToggle('show_cv_to_recruiters')}
                disabled={saving}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="font-bold text-slate-800">Nhận tin nhắn từ nhà tuyển dụng</p>
                  <p className="text-xs text-slate-400">Cho phép nhà tuyển dụng liên hệ bạn</p>
                </div>
              </div>
              <Switch
                checked={settings.allow_recruiter_messages}
                onCheckedChange={() => handleToggle('allow_recruiter_messages')}
                disabled={saving}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Visibility */}
      <Card className="rounded-xl border border-slate-100 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-500" />
            Kiểm soát hiển thị trường
          </CardTitle>
          <p className="text-sm text-slate-500 font-normal">
            Chọn những trường nào được hiển thị cho nhà tuyển dụng
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {VISIBLE_FIELDS.map(field => {
            const isVisible = (settings.visible_fields || []).includes(field.key);
            return (
              <div
                key={field.key}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border transition-all',
                  isVisible
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-100 bg-slate-50/50'
                )}
              >
                <div className="flex items-center gap-3">
                  {isVisible ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-slate-300 shrink-0" />
                  )}
                  <div>
                    <p className={cn('text-sm font-bold', isVisible ? 'text-slate-800' : 'text-slate-500')}>
                      {field.label}
                    </p>
                    <p className="text-xs text-slate-400">{field.description}</p>
                  </div>
                </div>
                <Switch
                  checked={isVisible}
                  onCheckedChange={() => handleFieldToggle(field.key)}
                  disabled={saving}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* CV Access Logs */}
      <Card className="rounded-xl border border-slate-100 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            Ai đã xem CV của bạn
          </CardTitle>
          <p className="text-sm text-slate-500 font-normal">
            Nhật ký truy cập CV trong 30 ngày gần đây
          </p>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : accessLogs.length > 0 ? (
            <div className="space-y-3">
              {accessLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {(log.recruiter_name || 'R')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{log.recruiter_name || 'Nhà tuyển dụng'}</p>
                      <p className="text-xs text-slate-400">{log.company_name || 'Công ty'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={log.action === 'viewed' ? 'default' : 'outline'} className="text-xs">
                      {log.action === 'viewed' ? 'Đã xem' : log.action || 'Xem'}
                    </Badge>
                    <p className="text-xs text-slate-400 mt-1">
                      {log.viewed_at ? new Date(log.viewed_at).toLocaleDateString('vi-VN') : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Eye className="mx-auto h-8 w-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">Chưa có ai xem CV của bạn</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Lưu ý về quyền riêng tư</p>
              <ul className="mt-2 text-xs text-amber-700 space-y-1">
                <li>• CV chỉ được chia sẻ khi bạn ứng tuyển hoặc bật tìm kiếm</li>
                <li>• Thông tin liên hệ chỉ hiển thị khi bạn cho phép</li>
                <li>• Nhà tuyển dụng không thể tải CV của bạn nếu bạn ẩn</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidatePrivacySettings;
