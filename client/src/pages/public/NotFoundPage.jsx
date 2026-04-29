import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center max-w-lg mx-auto"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative mb-8"
        >
          <span className="text-[10rem] md:text-[12rem] font-bold leading-none bg-gradient-to-br from-primary via-accent to-accent-600 bg-clip-text text-transparent select-none">
            404
          </span>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-20 h-20 bg-primary-50 rounded-xl flex items-center justify-center shadow-lg border border-primary-100">
              <Search size={36} className="text-primary-500" />
            </div>
          </motion.div>
        </motion.div>

        {/* Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 tracking-normal">
          Không tìm thấy trang
        </h1>
        <p className="text-slate-500 text-lg mb-10 leading-relaxed max-w-md mx-auto">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Hãy quay lại trang chủ để tiếp
          tục.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-8 py-4 text-sm font-bold text-foreground transition-all duration-200 ease-out hover:bg-muted/60 hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
          <Link
            to="/"
            className="flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-primary to-accent hover:from-primary hover:to-accent text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
          >
            <Home size={18} />
            Về trang chủ
          </Link>
          <Link
            to="/jobs"
            className="flex items-center gap-2.5 px-8 py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
          >
            <MapPin size={18} />
            Tìm việc làm
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
