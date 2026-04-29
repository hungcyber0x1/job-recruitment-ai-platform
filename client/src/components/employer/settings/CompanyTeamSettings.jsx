import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  Mail,
  MoreHorizontal,
  Loader2,
  ChevronDown,
  Check,
  X,
  AlertCircle,
  Crown,
  UserCog,
  User,
  Trash2,
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotification } from '../../context/NotificationContext';
import employerTeamService from '../../services/employerTeamService';
import { cn } from '../../utils';

const ROLE_CONFIG = {
  owner: {
    label: 'Chủ sở hữu',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Crown,
  },
  admin: {
    label: 'Quản trị viên',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    icon: UserCog,
  },
  recruiter: {
    label: 'Nhà tuyển dụng',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: User,
  },
};

const MemberRow = ({ member, currentUserId, onUpdateRole, onUpdatePermissions, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const RoleIcon = ROLE_CONFIG[member.role]?.icon || User;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all">
      <div
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold text-lg">
          {(member.first_name || member.email || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-900 truncate">
              {member.first_name ? `${member.first_name} ${member.last_name || ''}`.trim() : 'Thành viên'}
            </p>
            {member.role === 'owner' && (
              <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">{member.email}</p>
        </div>
        <Badge className={cn('border shrink-0', ROLE_CONFIG[member.role]?.color)}>
          <RoleIcon className="h-3 w-3 mr-1" />
          {ROLE_CONFIG[member.role]?.label}
        </Badge>
        <div className="flex items-center gap-1 shrink-0">
          {member.joined_at && (
            <span className="text-xs text-slate-400">
              {new Date(member.joined_at).toLocaleDateString('vi-VN')}
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', expanded && 'rotate-180')} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50/50">
          {/* Permissions */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-normal mb-3">
              Quyền hạn
            </p>
            <div className="grid grid-cols-2 gap-2">
              {employerTeamService.getPermissionFields().map(field => (
                <div key={field.key} className="flex items-center gap-2">
                  <Switch
                    checked={!!member[field.key]}
                    onCheckedChange={async (val) => {
                      if (member.role === 'owner') return;
                      setLoading(true);
                      try {
                        await onUpdatePermissions(member.user_id, { [field.key]: val });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading || member.role === 'owner'}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{field.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Change */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-500 shrink-0">Vai trò:</label>
            <Select
              value={member.role}
              onValueChange={async (val) => {
                if (member.role === 'owner') return;
                setLoading(true);
                try {
                  await onUpdateRole(member.user_id, val);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || member.role === 'owner'}
            >
              <SelectTrigger className="h-9 rounded-xl flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="recruiter">Nhà tuyển dụng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Remove */}
          {member.role !== 'owner' && (
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 h-9"
                onClick={() => onRemove(member)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Xóa khỏi công ty
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CompanyTeamSettings = () => {
  const { showNotification } = useNotification();
  const [members, setMembers] = useState([]);
  const [myPermissions, setMyPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'recruiter' });
  const [inviting, setInviting] = useState(false);
  const [removeDialog, setRemoveDialog] = useState(null);

  const loadData = async () => {
    try {
      const [teamRes, permsRes] = await Promise.allSettled([
        employerTeamService.getTeamMembers(),
        employerTeamService.getMyPermissions(),
      ]);
      if (teamRes.status === 'fulfilled') {
        setMembers(teamRes.value.data?.data || []);
      }
      if (permsRes.status === 'fulfilled') {
        setMyPermissions(permsRes.value.data?.data || null);
      }
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async () => {
    if (!inviteForm.email) {
      showNotification('Vui lòng nhập email', 'error');
      return;
    }
    setInviting(true);
    try {
      await employerTeamService.inviteMember(inviteForm);
      showNotification('Đã mời thành viên!', 'success');
      setInviteOpen(false);
      setInviteForm({ email: '', role: 'recruiter' });
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Không thể mời thành viên', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (userId, role) => {
    try {
      await employerTeamService.updateMemberRole(userId, { role });
      showNotification('Đã cập nhật vai trò!', 'success');
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi cập nhật vai trò', 'error');
    }
  };

  const handleUpdatePermissions = async (userId, permissions) => {
    try {
      await employerTeamService.updateMemberPermissions(userId, permissions);
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi cập nhật quyền', 'error');
    }
  };

  const handleRemove = async () => {
    if (!removeDialog) return;
    try {
      await employerTeamService.removeMember(removeDialog.user_id);
      showNotification('Đã xóa thành viên', 'success');
      setRemoveDialog(null);
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Không thể xóa thành viên', 'error');
    }
  };

  const isAdmin = myPermissions?.role === 'owner' || myPermissions?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Nhóm tuyển dụng</h2>
            <p className="text-sm text-slate-500">
              {isAdmin ? 'Quản lý thành viên và phân quyền' : 'Xem thành viên trong nhóm'}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600"
            onClick={() => setInviteOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Mời thành viên
          </Button>
        )}
      </div>

      {/* My Role */}
      {myPermissions && (
        <Card className="rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-700">Vai trò của bạn: {myPermissions.roleLabel}</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {Object.entries(myPermissions.permissions).filter(([,v]) => v).length} quyền được kích hoạt
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              currentUserId={myPermissions?.id}
              onUpdateRole={handleUpdateRole}
              onUpdatePermissions={handleUpdatePermissions}
              onRemove={(m) => setRemoveDialog(m)}
            />
          ))}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              Mời thành viên mới
            </DialogTitle>
            <DialogDescription>
              Thêm recruiter vào nhóm tuyển dụng của bạn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-1 block">Email</label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="recruiter@company.com"
                className="rounded-xl h-11"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-1 block">Vai trò</label>
              <Select
                value={inviteForm.role}
                onValueChange={val => setInviteForm(prev => ({ ...prev, role: val }))}
              >
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="admin">Quản trị viên - Full quyền quản lý</SelectItem>
                  <SelectItem value="recruiter">Nhà tuyển dụng - Quyền cơ bản</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-500 mb-2">Quyền mặc định:</p>
              {inviteForm.role === 'admin' ? (
                <p className="text-xs text-slate-600">Đăng tin, sửa tin, quản lý ứng viên, gửi email</p>
              ) : (
                <p className="text-xs text-slate-600">Đăng tin, xem và quản lý ứng viên</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setInviteOpen(false)} className="rounded-xl">
              Hủy
            </Button>
            <Button onClick={handleInvite} disabled={inviting} className="rounded-xl bg-emerald-500 hover:bg-emerald-600">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Gửi lời mời
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirm Dialog */}
      <Dialog open={!!removeDialog} onOpenChange={() => setRemoveDialog(null)}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Xác nhận xóa
            </DialogTitle>
            <DialogDescription>
              Xóa <strong>{removeDialog?.first_name || removeDialog?.email}</strong> khỏi nhóm?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRemoveDialog(null)} className="rounded-xl">
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleRemove} className="rounded-xl">
              Xóa thành viên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyTeamSettings;
