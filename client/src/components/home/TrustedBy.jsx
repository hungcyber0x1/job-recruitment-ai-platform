import React from 'react';
import { motion } from 'framer-motion';

const partners = [
  {
    key: 'vng',
    name: 'VNG',
    imgUrl:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgNDAiPjx0ZXh0IHg9IjUwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjM0IiBmaWxsPSIjZjI2NTIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5WTkc8L3RleHQ+PC9zdmc+',
    className: 'h-8 sm:h-10 w-auto object-contain',
  },
  {
    key: 'shopee',
    name: 'Shopee',
    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg',
    className: 'h-10 sm:h-12 w-auto object-contain',
  },
  {
    key: 'mb',
    name: 'MB Bank',
    imgUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/02/Icon-MB-Bank-MBB.png',
    className: 'h-8 sm:h-10 w-auto object-contain',
  },
  {
    key: 'fpt',
    name: 'FPT Software',
    imgUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-FPT.png',
    className: 'h-8 sm:h-10 w-auto object-contain',
  },
  {
    key: 'momo',
    name: 'MoMo',
    imgUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Circle.png',
    className: 'h-8 sm:h-10 w-auto object-contain',
  },
  {
    key: 'viettel',
    name: 'Viettel',
    imgUrl:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDAgNDAiPjx0ZXh0IHg9IjcwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iOTAwIiBmb250LXNpemU9IjMyIiBmaWxsPSIjRUUwMDMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj52aWV0dGVsPC90ZXh0Pjwvc3ZnPg==',
    className: 'h-10 sm:h-12 w-auto object-contain',
  },
];

function PartnerLogo({ p }) {
  return (
    <div className="flex flex-col items-center justify-center transition-all duration-300 hover:scale-105">
      <img
        src={p.imgUrl}
        alt={`${p.name} logo`}
        className={p.className}
        loading="lazy"
        onError={(e) => {
          // Fallback to text if image fails to load
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
      />
      <span className="hidden text-base font-bold text-slate-700 md:text-lg text-center leading-tight">
        {p.name}
      </span>
    </div>
  );
}

const TrustedBy = () => {
  return (
    <div className="relative">
      <p className="text-center text-[16px] md:text-[17px] font-medium text-slate-500/90 tracking-tight">
        Được tin dùng bởi các đơn vị hàng đầu
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-10 px-2 sm:gap-x-12 md:gap-x-14">
        {partners.map((p, i) => (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="flex min-h-[52px] select-none flex-col items-center justify-end"
          >
            <PartnerLogo p={p} />
          </motion.div>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-5xl border-t border-slate-200/90" aria-hidden />
    </div>
  );
};

export default TrustedBy;
