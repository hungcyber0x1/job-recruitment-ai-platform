import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Briefcase, MapPin, DollarSign, Clock, Plus, Save, Sparkles } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';

function todayYmdLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const JobPostForm = ({ initialData, categories, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(
    initialData || {
      title: '',
      category_id: '',
      type: 'full-time',
      location: '',
      salary_min: '',
      salary_max: '',
      description: '',
      requirements: '',
      benefits: '',
      deadline: '',
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <Card className="border border-border bg-white p-10 shadow-premium">
        <div className="flex items-center gap-4 mb-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-premium">
            <Plus size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black leading-tight text-foreground">
              {initialData ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng mới'}
            </h2>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-txt-light">
              Hãy cung cấp đầy đủ thông tin để AI Matching hoạt động tốt nhất
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <Input
              label="Tiêu đề công việc"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Senior Frontend Developer (React)"
              required
              icon={<Briefcase size={18} />}
            />
          </div>

          <div className="space-y-3">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-txt-light">
              Lĩnh vực / Ngành nghề
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full appearance-none rounded-2xl border border-border bg-muted px-6 py-4 font-medium outline-none transition-all focus:border-secondary focus:bg-white"
              required
            >
              <option value="">Chọn lĩnh vực</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-txt-light">
              Hình thức làm việc
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full appearance-none rounded-2xl border border-border bg-muted px-6 py-4 font-medium outline-none transition-all focus:border-secondary focus:bg-white"
            >
              <option value="full-time">Toàn thời gian</option>
              <option value="part-time">Bán thời gian</option>
              <option value="contract">Hợp đồng</option>
              <option value="remote">Làm việc từ xa</option>
            </select>
          </div>

          <Input
            label="Địa điểm làm việc"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="VD: Quận 1, TP. HCM"
            required
            icon={<MapPin size={18} />}
          />

          <Input
            label="Hạn nộp hồ sơ (tùy chọn)"
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
            min={todayYmdLocal()}
            icon={<Clock size={18} />}
          />

          <Input
            label="Lương tối thiểu (VND)"
            name="salary_min"
            type="number"
            value={formData.salary_min}
            onChange={handleChange}
            placeholder="VD: 15,000,000"
            icon={<DollarSign size={18} />}
          />

          <Input
            label="Lương tối đa (VND)"
            name="salary_max"
            type="number"
            value={formData.salary_max}
            onChange={handleChange}
            placeholder="VD: 25,000,000"
            icon={<DollarSign size={18} />}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border border-border bg-white p-10 shadow-card">
            <h3 className="mb-8 flex items-center gap-3 text-xl font-black text-foreground">
              <div className="h-6 w-1.5 rounded-full bg-secondary"></div>
              Chi tiết công việc
            </h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-txt-light">
                  Mô tả công việc
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="8"
                  className="w-full rounded-[32px] border border-border bg-muted px-6 py-4 font-medium outline-none transition-all focus:border-secondary focus:bg-white"
                  placeholder="Nhiệm vụ và trách nhiệm chính của vị trí này..."
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-txt-light">
                  Yêu cầu ứng viên
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  rows="8"
                  className="w-full rounded-[32px] border border-border bg-muted px-6 py-4 font-medium outline-none transition-all focus:border-secondary focus:bg-white"
                  placeholder="Kỹ năng, học vấn và kinh nghiệm cần thiết..."
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-txt-light">
                  Quyền lợi
                </label>
                <textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  rows="8"
                  className="w-full rounded-[32px] border border-border bg-muted px-6 py-4 font-medium outline-none transition-all focus:border-secondary focus:bg-white"
                  placeholder="Lương thưởng, bảo hiểm, văn hóa công ty..."
                  required
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="group relative overflow-hidden bg-primary p-8 text-white">
            <Sparkles
              className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-500"
              size={120}
            />
            <h4 className="text-xl font-black mb-4">AI Optimizer</h4>
            <p className="mb-8 text-sm font-medium leading-relaxed text-white/70">
              Hệ thống AI của chúng tôi sẽ phân tích các từ khóa trong mô tả của bạn để đảm bảo tin
              tuyển dụng tiếp cận đúng đối tượng ứng viên nhất.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="uppercase tracking-widest text-white/60">Độ phủ từ khóa</span>
                <span className="text-accent">85%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-[85%] rounded-full bg-accent shadow-[0_0_15px_rgba(6,182,212,0.45)]"></div>
              </div>
            </div>
          </Card>

          <div className="sticky top-32 space-y-4">
            <Button
              type="submit"
              variant="primary"
              className="w-full gap-3 rounded-3xl bg-primary py-5 text-lg font-black text-white shadow-premium"
            >
              <Save size={24} />
              {initialData ? 'Cập nhật tin' : 'Đăng tuyển ngay'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-3xl border border-border bg-white py-5 font-bold text-txt-muted hover:text-secondary"
              onClick={onCancel}
            >
              Hủy bỏ
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

JobPostForm.propTypes = {
  initialData: PropTypes.shape({
    title: PropTypes.string,
    category_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    type: PropTypes.string,
    location: PropTypes.string,
    salary_min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    salary_max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    description: PropTypes.string,
    requirements: PropTypes.string,
    benefits: PropTypes.string,
    deadline: PropTypes.string,
  }),
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string,
    })
  ),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

JobPostForm.defaultProps = {
  initialData: null,
  categories: [],
};

export default JobPostForm;
