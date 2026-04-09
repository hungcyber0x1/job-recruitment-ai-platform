import React from 'react';
import ModernHeader from './ModernHeader';
import ModernFooter from './ModernFooter';
import { motion } from 'framer-motion';

const ModernLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20 selection:text-primary">
      <ModernHeader />
      <main className="flex-grow pt-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
      <ModernFooter />
    </div>
  );
};

export default ModernLayout;
