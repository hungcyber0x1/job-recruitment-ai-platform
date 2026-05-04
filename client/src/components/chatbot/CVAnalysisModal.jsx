'use client';

import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  FileText,
  Sparkles,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import chatbotService from '../../services/chatbotService';

/**
 * CV Analysis Modal - Structured CV extraction and CV improvement guidance.
 * Allows users to upload a CV and optionally compare against a job description.
 */
const CVAnalysisModal = ({ isOpen, onClose, initialJobDescription = '' }) => {
  const [cvFile, setCvFile] = useState(null);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('upload'); // 'upload' | 'results'
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('Chỉ chấp nhận file PDF hoặc Word (.doc, .docx)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File quá lớn. Tối đa 5MB.');
        return;
      }
      setCvFile(file);
      setError(null);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!cvFile) {
      setError('Vui lòng chọn file CV');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await chatbotService.analyzeCV(cvFile, jobDescription || null);
      const data = response.data?.data?.analysis;

      if (data) {
        setAnalysisResult(data);
        setMode('results');
      } else {
        setError(response.data?.message || 'Phân tích CV thất bại');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi phân tích CV: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCvFile(null);
    setAnalysisResult(null);
    setError(null);
    setMode('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-white border-b border-slate-100 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Phân tích CV</h2>
                    <p className="text-sm text-slate-500">
                      Trích xuất thông tin & đánh giá phù hợp
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {mode === 'upload' && (
                <div className="space-y-5">
                  {/* CV Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Upload CV <span className="text-red-500">*</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                        cvFile
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {cvFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle size={32} className="text-emerald-500" />
                          <p className="font-medium text-emerald-700">{cvFile.name}</p>
                          <p className="text-sm text-slate-500">
                            {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={32} className="text-slate-400" />
                          <p className="text-slate-600">Click để chọn file CV</p>
                          <p className="text-sm text-slate-400">PDF, DOC, DOCX (tối đa 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Job Description (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Mô tả công việc (tùy chọn)
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Dán mô tả công việc để so sánh mức độ phù hợp..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none transition-all"
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      Để trống nếu chỉ muốn trích xuất thông tin từ CV
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleAnalyze}
                      disabled={!cvFile || isAnalyzing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium shadow-md shadow-emerald-200/50 hover:from-emerald-500 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Đang phân tích...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Phân tích CV
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'results' && analysisResult && (
                <div className="space-y-5">
                  {/* Profile Summary */}
                  {analysisResult.summary && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <FileText size={16} className="text-slate-500" />
                        Tóm tắt hồ sơ
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {analysisResult.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {analysisResult.skills?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <TrendingUp size={16} className="text-slate-500" />
                        Kỹ năng ({analysisResult.skills.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {analysisResult.missing_skills?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-500" />
                        Kỹ năng còn thiếu
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.missing_skills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvement Suggestions */}
                  {analysisResult.improvement_suggestions?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <Star size={16} className="text-emerald-500" />
                        Gợi ý cải thiện
                      </h3>
                      <ul className="space-y-2">
                        {analysisResult.improvement_suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleReset}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                      Phân tích CV khác
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium shadow-md shadow-emerald-200/50 hover:from-emerald-500 hover:to-emerald-600 transition-all"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

CVAnalysisModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialJobDescription: PropTypes.string,
};

export default CVAnalysisModal;
