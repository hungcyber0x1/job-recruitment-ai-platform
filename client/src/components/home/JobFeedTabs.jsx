import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Flame } from 'lucide-react';
import UrgentHiring from './UrgentHiring';
import FeaturedJobs from './FeaturedJobs';

const JobFeedTabs = () => {
  const [activeTab, setActiveTab] = useState('featured');

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                Việc làm
              </p>
              <h2 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tighter leading-[0.95]">
                Cơ hội <span className="text-primary">dành cho bạn</span>
              </h2>
            </motion.div>

            <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex-shrink-0 border border-border/60">
              <TabsTrigger
                value="featured"
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] px-6 py-3 rounded-lg font-semibold text-sm text-muted-foreground transition-all"
              >
                <Briefcase size={14} className="mr-2" /> Đề xuất
              </TabsTrigger>
              <TabsTrigger
                value="urgent"
                className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-[0_4px_12px_-2px_rgba(249,115,22,0.12)] px-6 py-3 rounded-lg font-semibold text-sm text-muted-foreground transition-all"
              >
                <Flame size={14} className="mr-2" /> Tuyển gấp
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-0"
            >
              {activeTab === 'featured' ? <FeaturedJobs /> : <UrgentHiring />}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </section>
  );
};

export default JobFeedTabs;
