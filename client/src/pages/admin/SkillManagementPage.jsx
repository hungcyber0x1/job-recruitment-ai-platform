import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  Users,
  Briefcase,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useNotification } from '@/context/NotificationContext';
import adminService from '@/services/adminService';

const normalizeSkillPayload = (payload) =>
  payload.map((skill) => ({
    id: Number(skill?.id ?? 0),
    name: String(skill?.name ?? ''),
    slug: String(skill?.slug ?? ''),
    categoryId: skill?.category_id != null ? Number(skill.category_id) : null,
    categoryName: String(skill?.category_name ?? skill?.category ?? ''),
    isActive: Boolean(Number(skill?.is_active ?? 1)),
    jobCount: Number(skill?.job_count ?? 0),
    candidateCount: Number(skill?.candidate_count ?? 0),
  }));

const normalizeCategoryPayload = (payload) =>
  payload.map((category) => ({
    id: Number(category?.id ?? 0),
    name: String(category?.name ?? ''),
    isActive: Boolean(Number(category?.is_active ?? 1)),
  }));

const SkillManagementPage = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editModal, setEditModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [skillsRes, categoriesRes] = await Promise.all([
        adminService.getSkills(),
        adminService.getCategories(),
      ]);

      const skillPayload = Array.isArray(skillsRes?.data?.data)
        ? skillsRes.data.data
        : Array.isArray(skillsRes?.data)
          ? skillsRes.data
          : [];

      const categoryPayload = Array.isArray(categoriesRes?.data?.data)
        ? categoriesRes.data.data
        : Array.isArray(categoriesRes?.data)
          ? categoriesRes.data
          : [];

      setSkills(normalizeSkillPayload(skillPayload));
      setCategories(normalizeCategoryPayload(categoryPayload));
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      setSkills([]);
      setCategories([]);
      showNotification('Không tải được dữ liệu kỹ năng', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeCategories = useMemo(
    () =>
      categories
        .filter((category) => category.isActive)
        .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    [categories]
  );

  const filteredSkills = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return skills.filter((skill) => {
      const matchesSearch =
        !keyword ||
        skill.name.toLowerCase().includes(keyword) ||
        skill.categoryName.toLowerCase().includes(keyword);
      const matchesCategory =
        categoryFilter === 'all' || String(skill.categoryId ?? '') === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [skills, searchQuery, categoryFilter]);

  const stats = useMemo(() => {
    const linkedCategoryCount = new Set(
      skills.map((skill) => skill.categoryId).filter((categoryId) => categoryId != null)
    ).size;

    return {
      totalSkills: skills.length,
      activeSkills: skills.filter((skill) => skill.isActive).length,
      linkedCategories: linkedCategoryCount,
      totalJobUsage: skills.reduce((sum, skill) => sum + skill.jobCount, 0),
    };
  }, [skills]);

  const resetModal = () => {
    setEditModal(null);
    setSaving(false);
  };

  const handleSaveSkill = async () => {
    if (!editModal?.name?.trim()) {
      showNotification('Vui lòng nhập tên kỹ năng', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: editModal.name.trim(),
        category_id: editModal.categoryId ? Number(editModal.categoryId) : null,
        is_active: editModal.isActive,
      };

      if (editModal.id) {
        await adminService.updateSkill(editModal.id, payload);
        showNotification('Đã cập nhật kỹ năng', 'success');
      } else {
        await adminService.createSkill(payload);
        showNotification('Đã thêm kỹ năng mới', 'success');
      }

      resetModal();
      fetchData();
    } catch (error) {
      console.error('Failed to save skill:', error);
      showNotification('Lỗi khi lưu kỹ năng', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Xóa kỹ năng này khỏi taxonomy?')) return;

    try {
      await adminService.deleteSkill(id);
      showNotification('Đã xóa kỹ năng', 'success');
      fetchData();
    } catch (error) {
      console.error('Failed to delete skill:', error);
      showNotification('Lỗi khi xóa kỹ năng', 'error');
    }
  };

  const handleToggleActive = async (skill) => {
    try {
      await adminService.updateSkill(skill.id, { is_active: !skill.isActive });
      showNotification(`Đã ${skill.isActive ? 'vô hiệu hóa' : 'kích hoạt'} kỹ năng`, 'success');
      fetchData();
    } catch (error) {
      console.error('Failed to toggle skill:', error);
      showNotification('Lỗi khi cập nhật trạng thái kỹ năng', 'error');
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Kỹ năng phụ trợ"
        description="Màn quản lý phụ cho dữ liệu kỹ năng dùng trong hồ sơ ứng viên, tin tuyển dụng và matching. Không còn là mục menu chính ở admin."
        badge="Phụ trợ"
        actions={
          <Link
            to="/admin/categories"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <ArrowLeft size={16} />
            Về Ngành nghề
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-slate-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{stats.totalSkills}</div>
            <p className="text-sm text-slate-500">Tổng kỹ năng</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.activeSkills}</div>
            <p className="text-sm text-slate-500">Đang hoạt động</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{stats.linkedCategories}</div>
            <p className="text-sm text-slate-500">Ngành đã liên kết</p>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.totalJobUsage}</div>
            <p className="text-sm text-slate-500">Lượt gắn vào jobs</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-slate-200">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag size={18} className="text-emerald-600" />
              Danh sách kỹ năng ({filteredSkills.length})
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Dùng một contract admin duy nhất, không còn fallback mock hay endpoint public sai
              nghĩa.
            </p>
          </div>

          <Button
            onClick={() =>
              setEditModal({
                id: null,
                name: '',
                categoryId: '',
                isActive: true,
              })
            }
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <Plus size={16} className="mr-2" />
            Thêm kỹ năng
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Tìm kiếm theo kỹ năng hoặc ngành..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Tất cả ngành</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                    Kỹ năng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
                    Ngành nghề
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-normal text-slate-500">
                    Jobs
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-normal text-slate-500">
                    Candidates
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-normal text-slate-500">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-normal text-slate-500">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
                    </td>
                  </tr>
                ) : filteredSkills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Không tìm thấy kỹ năng nào khớp bộ lọc hiện tại
                    </td>
                  </tr>
                ) : (
                  filteredSkills.map((skill) => (
                    <tr
                      key={skill.id}
                      className="border-b border-slate-50 transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                            <Tag size={14} className="text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{skill.name}</p>
                            <p className="text-xs uppercase tracking-normal text-slate-400">
                              {skill.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-slate-50">
                          {skill.categoryName || 'Chưa gắn ngành'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Briefcase size={14} className="text-slate-400" />
                          {skill.jobCount}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Users size={14} className="text-slate-400" />
                          {skill.candidateCount}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {skill.isActive ? (
                          <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                            <CheckCircle2 size={12} className="mr-1" />
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400">
                            <XCircle size={12} className="mr-1" />
                            Vô hiệu
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(skill)}
                            className="h-8 w-8"
                            title={skill.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {skill.isActive ? (
                              <XCircle size={14} className="text-slate-400" />
                            ) : (
                              <CheckCircle2 size={14} className="text-emerald-600" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setEditModal({
                                id: skill.id,
                                name: skill.name,
                                categoryId: skill.categoryId ? String(skill.categoryId) : '',
                                isActive: skill.isActive,
                              })
                            }
                            className="h-8 w-8"
                          >
                            <Pencil size={14} className="text-slate-400" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSkill(skill.id)}
                            className="h-8 w-8 hover:text-red-600"
                          >
                            <Trash2 size={14} className="text-slate-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {editModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-bold">
                {editModal.id ? 'Chỉnh sửa kỹ năng' : 'Thêm kỹ năng mới'}
              </h3>
              <button type="button" onClick={resetModal}>
                <X size={20} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-semibold">Tên kỹ năng *</label>
                <Input
                  value={editModal.name}
                  onChange={(event) =>
                    setEditModal((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="VD: React.js, SQL, Docker..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Ngành nghề</label>
                <select
                  value={editModal.categoryId}
                  onChange={(event) =>
                    setEditModal((prev) => ({
                      ...prev,
                      categoryId: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Chưa gắn ngành</option>
                  {activeCategories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={editModal.isActive}
                  onChange={(event) =>
                    setEditModal((prev) => ({
                      ...prev,
                      isActive: event.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Kích hoạt kỹ năng này
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">
              <Button variant="outline" onClick={resetModal}>
                Hủy
              </Button>
              <Button
                onClick={handleSaveSkill}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default SkillManagementPage;
