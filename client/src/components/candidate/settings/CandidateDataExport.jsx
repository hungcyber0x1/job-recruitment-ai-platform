import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Shield,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
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
import { useNotification } from '../../../context/NotificationContext';
import privacyService from '../../../services/privacyService';
import { cn } from '../../../utils';

const DataExportSection = () => {
  const { showNotification } = useNotification();
  const [exportStatus, setExportStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleRequestExport = async () => {
    setLoading(true);
    try {
      const res = await privacyService.requestDataExport();
      setExportStatus(res.data?.data || { status: 'pending' });
      showNotification('Yêu cầu xuất dữ liệu đã được gửi! Bạn sẽ nhận email khi hoàn tất.', 'success');
    } catch (err) {
      console.warn('DataExport request failed:', err?.message);
      showNotification('Không thể gửi yêu cầu. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      const res = await privacyService.getDataExportStatus();
      setExportStatus(res.data?.data);
    } catch (err) {
      console.warn('DataExport status check failed:', err?.message);
    }
  };

  const handleDownload = async (exportId) => {
    try {
      const res = await privacyService.downloadDataExport(exportId);
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emerald-profile-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('Đã tải dữ liệu thành công!', 'success');
    } catch (err) {
      console.warn('DataExport download failed:', err?.message);
      showNotification('Không thể tải dữ liệu.', 'error');
    }
  };

  return (
    <Card className="rounded-xl border border-slate-100 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Download className="h-4 w-4 text-emerald-500" />
          Xuất dữ liệu cá nhân
        </CardTitle>
        <p className="text-sm text-slate-500 font-normal">
          Tải toàn bộ dữ liệu của bạn theo quy định GDPR
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <h4 className="text-sm font-bold text-emerald-800 mb-2">Dữ liệu bao gồm:</h4>
          <ul className="text-xs text-emerald-700 space-y-1">
            <li>• Thông tin hồ sơ cá nhân</li>
            <li>• CV và tài liệu đã tải lên</li>
            <li>• Đơn ứng tuyển và lịch sử</li>
            <li>• Kỹ năng, kinh nghiệm, học vấn</li>
            <li>• Cài đặt và sở thích</li>
          </ul>
        </div>

        {exportStatus?.status === 'ready' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-800">Dữ liệu đã sẵn sàng</p>
                <p className="text-xs text-emerald-600">Có sẵn để tải về trong 7 ngày</p>
              </div>
            </div>
            <Button
              onClick={() => handleDownload(exportStatus.id)}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 h-10"
            >
              <Download className="h-4 w-4 mr-2" />
              Tải dữ liệu (JSON)
            </Button>
          </div>
        ) : exportStatus?.status === 'pending' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <Clock className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800">Đang xử lý</p>
                <p className="text-xs text-amber-600">Dữ liệu sẽ sẵn sàng trong ít nhất 24 giờ</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleCheckStatus}
              className="w-full rounded-xl h-10"
            >
              Kiểm tra trạng thái
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleRequestExport}
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 h-10"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Yêu cầu xuất dữ liệu
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const AccountDeletionSection = () => {
  const { showNotification } = useNotification();
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'XÓA TÀI KHOẢN') {
      showNotification('Vui lòng nhập chính xác "XÓA TÀI KHOẢN"', 'error');
      return;
    }
    setLoading(true);
    try {
      await privacyService.requestAccountDeletion(password);
      showNotification('Yêu cầu xóa tài khoản đã được gửi. Kiểm tra email để xác nhận.', 'success');
      setShowDialog(false);
      setPassword('');
      setConfirmText('');
    } catch (err) {
      console.warn('DataExport delete request failed:', err?.message);
      showNotification(err.response?.data?.message || 'Không thể gửi yêu cầu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="rounded-xl border border-red-100 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-500" />
            Xóa tài khoản
          </CardTitle>
          <p className="text-sm text-slate-500 font-normal">
            Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu của bạn
          </p>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 mb-4">
            <h4 className="text-sm font-bold text-red-800 mb-2">⚠️ Lưu ý quan trọng:</h4>
            <ul className="text-xs text-red-700 space-y-1">
              <li>• Tài khoản sẽ bị xóa vĩnh viễn sau 14 ngày</li>
              <li>• Tất cả CV, hồ sơ, đơn ứng tuyển sẽ bị xóa</li>
              <li>• Bạn có thể hủy trong 14 ngày nếu đổi ý</li>
              <li>• Không thể khôi phục sau khi xác nhận</li>
            </ul>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDialog(true)}
            className="w-full rounded-xl border-red-200 text-red-500 hover:bg-red-50 h-10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Yêu cầu xóa tài khoản
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận xóa tài khoản
            </DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Tài khoản sẽ bị vô hiệu hóa ngay lập tức.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Nhập mật khẩu để xác nhận</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="mt-1 rounded-xl h-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Gõ "<span className="font-bold text-red-600">XÓA TÀI KHOẢN</span>" để xác nhận
              </label>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="XÓA TÀI KHOẢN"
                className="mt-1 rounded-xl h-11"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || !password || confirmText !== 'XÓA TÀI KHOẢN'}
              className="rounded-xl"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const CandidateDataExport = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
          <Shield className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Dữ liệu & Quyền riêng tư</h2>
          <p className="text-sm text-slate-500">Xuất hoặc xóa dữ liệu cá nhân theo GDPR</p>
        </div>
      </div>

      <DataExportSection />
      <AccountDeletionSection />
    </div>
  );
};

export default CandidateDataExport;
