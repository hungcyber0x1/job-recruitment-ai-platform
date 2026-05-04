import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { cn } from '@/utils';

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image', 'code-block'],
    ['clean'],
  ],
};

const RichTextEditor = ({ value, onChange, placeholder, className, minHeight = '300px' }) => {
  return (
    <div className={cn('rich-text-editor-container', className)}>
      <style>{`
        .rich-text-editor-container .ql-toolbar.ql-snow {
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          border-color: #e2e8f0;
          background-color: #f8fafc;
          padding: 0.75rem 1rem;
        }
        .rich-text-editor-container .ql-container.ql-snow {
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          border-color: #e2e8f0;
          min-height: ${minHeight};
          font-family: inherit;
          font-size: 1rem;
        }
        .rich-text-editor-container .ql-editor {
          min-height: ${minHeight};
          padding: 1.5rem;
          line-height: 1.75;
          color: #1e293b;
        }
        .rich-text-editor-container .ql-editor.ql-blank::before {
          left: 1.5rem;
          color: #94a3b8;
          font-style: normal;
        }
        .rich-text-editor-container .ql-snow.ql-toolbar button:hover,
        .rich-text-editor-container .ql-snow.ql-toolbar button:focus,
        .rich-text-editor-container .ql-snow.ql-toolbar button.ql-active {
          color: #10b981;
        }
        .rich-text-editor-container .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: #10b981;
        }
        .rich-text-editor-container .ql-snow.ql-toolbar button.ql-active .ql-fill {
          fill: #10b981;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
