import PropTypes from 'prop-types';
import React from 'react';
import { Sparkles } from 'lucide-react';

const questions = [
  'Làm thế nào để tối ưu hóa CV?',
  'Dự báo mức lương ngành IT năm 2026?',
  '5 kỹ năng quan trọng cho lập trình giao diện?',
  'Cách chuẩn bị cho buổi phỏng vấn?',
  'Lộ trình trở thành nhà thiết kế cấp cao?',
];

const SuggestedQuestions = ({ onSelect }) => {
  return (
    <div className="flex flex-wrap gap-3 p-6 bg-gray-50/50 border-t border-gray-50">
      <div className="w-full flex items-center gap-2 text-sm font-bold text-emerald-600 uppercase tracking-normal mb-1">
        <Sparkles size={14} />
        Gợi ý dành cho bạn
      </div>
      {questions.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:border-emerald-600 hover:text-emerald-600 hover:shadow-lg hover:shadow-indigo-50 transition-all"
        >
          {q}
        </button>
      ))}
    </div>
  );
};

SuggestedQuestions.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default SuggestedQuestions;
