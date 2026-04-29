import React from 'react';
import { Globe, MapPin, Phone, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, USER_REGION_LABELS, USER_REGION_VALUES, normalizeUserRegion } from '@/utils/index';

const IdentityFormFields = ({
  formData,
  handleChange,
  handleSelectChange,
  className,
  addressFieldName = 'address',
}) => {
  const fieldClass =
    'h-11 rounded-xl border-slate-200 bg-white text-base shadow-sm focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20';

  return (
    <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-2', className)}>
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2 text-slate-700">
          <Phone className="h-4 w-4 text-emerald-500" />
          Số điện thoại
        </Label>
        <p className="text-sm text-muted-foreground">Ví dụ: +84 900 000 000</p>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={handleChange}
          className={cn(fieldClass)}
          placeholder="Nhập số điện thoại liên hệ"
          autoComplete="tel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={addressFieldName} className="flex items-center gap-2 text-slate-700">
          <MapPin className="h-4 w-4 text-emerald-500" />
          Địa điểm/Địa chỉ
        </Label>
        <p className="text-sm text-muted-foreground">Thành phố hoặc khu vực sinh sống</p>
        <Input
          id={addressFieldName}
          name={addressFieldName}
          value={formData[addressFieldName] || ''}
          onChange={handleChange}
          className={cn(fieldClass)}
          placeholder="Ví dụ: TP. Hồ Chí Minh"
          autoComplete="address-level2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender" className="flex items-center gap-2 text-slate-700">
          <Users className="h-4 w-4 text-emerald-500" />
          Giới tính
        </Label>
        <p className="text-sm text-muted-foreground">Thông tin cơ bản</p>
        <Select value={formData.gender || ''} onValueChange={(value) => handleSelectChange('gender', value)}>
          <SelectTrigger className={cn(fieldClass)}>
            <SelectValue placeholder="Chọn giới tính" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
            <SelectItem value="male">Nam</SelectItem>
            <SelectItem value="female">Nữ</SelectItem>
            <SelectItem value="other">Khác</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="region" className="flex items-center gap-2 text-slate-700">
          <Globe className="h-4 w-4 text-emerald-500" />
          Vùng miền
        </Label>
        <p className="text-sm text-muted-foreground">Khu vực địa lý</p>
        <Select
          value={normalizeUserRegion(formData.region || '')}
          onValueChange={(value) => handleSelectChange('region', value)}
        >
          <SelectTrigger className={cn(fieldClass)}>
            <SelectValue placeholder="Chọn vùng miền" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-xl">
            {USER_REGION_VALUES.map((region) => (
              <SelectItem key={region} value={region}>
                {USER_REGION_LABELS[region]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default IdentityFormFields;
