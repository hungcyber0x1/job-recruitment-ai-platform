import PropTypes from 'prop-types';
import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';

const FileUpload = ({ onFileSelect, accept = '.pdf,.doc,.docx', maxSize = 5 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile) => {
    setError(null);

    // Check file type
    const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
    const acceptedExtensions = accept.split(',').map((ext) => ext.trim());

    if (!acceptedExtensions.includes(fileExtension)) {
      setError(`Chỉ chấp nhận các định dạng: ${accept}`);
      return false;
    }

    // Check size (maxSize in MB)
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`Kích thước file không được vượt quá ${maxSize}MB`);
      return false;
    }

    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        onFileSelect(selectedFile);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        onFileSelect(selectedFile);
      }
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 text-center ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : file
              ? 'border-green-500 bg-green-50'
              : 'border-slate-300 hover:border-primary-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
        />

        {!file ? (
          <div className="flex flex-col items-center gap-4 cursor-pointer">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center shadow-inner">
              <Upload size={32} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">Tải lên CV của bạn</p>
              <p className="text-slate-500 mt-1">Kéo thả hoặc nhấn để chọn tệp</p>
            </div>
            <div className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-500">
              Hỗ trợ: PDF, DOC, DOCX (Max {maxSize}MB)
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 py-2 px-4 bg-white rounded-xl shadow-sm border border-green-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <File size={20} />
              </div>
              <div className="text-left overflow-hidden">
                <p className="font-semibold text-slate-900 truncate">{file.name}</p>
                <p className="text-base text-slate-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              <button
                onClick={removeFile}
                className="p-1.5 hover:bg-muted/55 rounded-full text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-base mt-2 flex items-center gap-1">
          <span className="w-1 h-1 bg-red-500 rounded-full inline-block" />
          {error}
        </p>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
};

export default FileUpload;
