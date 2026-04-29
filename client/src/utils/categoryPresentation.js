import { createElement } from 'react';
import {
  BookOpen,
  Briefcase,
  Building2,
  Factory,
  FlaskConical,
  GraduationCap,
  Handshake,
  HeartPulse,
  Hotel,
  Landmark,
  Leaf,
  Megaphone,
  Newspaper,
  Palette,
  Scale,
  Sparkles,
  Tag,
  Truck,
  Users,
  Wrench,
  Code2,
} from 'lucide-react';

const ICON_MAP = {
  code: Code2,
  megaphone: Megaphone,
  'chart-line': Landmark,
  briefcase: Briefcase,
  users: Users,
  cogs: Factory,
  palette: Palette,
  book: BookOpen,
  'heart-pulse': HeartPulse,
  scale: Scale,
  truck: Truck,
  hotel: Hotel,
  building: Building2,
  leaf: Leaf,
  wrench: Wrench,
  newspaper: Newspaper,
  flask: FlaskConical,
  handshake: Handshake,
  sparkles: Sparkles,
  tag: Tag,
};

export const normalizeCategoryList = (payload = []) =>
  payload.map((category) => ({
    id: Number(category?.id ?? 0),
    name: String(category?.name ?? ''),
    slug: String(category?.slug ?? ''),
    description: String(category?.description ?? ''),
    icon: String(category?.icon ?? category?.icon_url ?? ''),
    jobCount: Number(category?.job_count ?? category?.jobCount ?? 0),
    skillCount: Number(category?.skill_count ?? category?.skillCount ?? 0),
    sortOrder: Number(category?.sort_order ?? category?.sortOrder ?? 0),
    isActive:
      category?.is_active === undefined || category?.is_active === null
        ? true
        : Boolean(Number(category.is_active)),
  }));

export const unwrapCategoryListResponse = (response) => {
  const payload = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : [];

  return normalizeCategoryList(payload);
};

export const getCategoryIconComponent = (category = {}) => {
  const iconKey = String(category?.icon || '').trim().toLowerCase();
  if (ICON_MAP[iconKey]) {
    return ICON_MAP[iconKey];
  }

  const hint = `${category?.slug || ''} ${category?.name || ''}`.toLowerCase();

  if (
    hint.includes('cntt') ||
    hint.includes('it') ||
    hint.includes('tech') ||
    hint.includes('ai') ||
    hint.includes('data')
  ) {
    return Code2;
  }

  if (hint.includes('marketing') || hint.includes('truyền thông') || hint.includes('media')) {
    return Megaphone;
  }

  if (hint.includes('tài chính') || hint.includes('kế toán') || hint.includes('ngân hàng')) {
    return Landmark;
  }

  if (hint.includes('thiết kế') || hint.includes('sáng tạo')) {
    return Palette;
  }

  if (hint.includes('nhân sự') || hint.includes('hành chính')) {
    return Users;
  }

  if (hint.includes('logistics') || hint.includes('vận tải')) {
    return Truck;
  }

  if (hint.includes('giáo dục') || hint.includes('đào tạo')) {
    return GraduationCap;
  }

  if (hint.includes('y tế') || hint.includes('dược')) {
    return HeartPulse;
  }

  if (hint.includes('pháp lý')) {
    return Scale;
  }

  if (hint.includes('bất động sản') || hint.includes('xây dựng')) {
    return Building2;
  }

  return Briefcase;
};

export const renderCategoryIcon = (category, props = {}) => {
  const Icon = getCategoryIconComponent(category);
  return createElement(Icon, {
    'aria-hidden': 'true',
    size: 20,
    strokeWidth: 1.8,
    ...props,
  });
};
