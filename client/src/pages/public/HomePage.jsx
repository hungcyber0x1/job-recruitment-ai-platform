import React from 'react';
import { ScrollReveal } from '../../components/common';
import ModernHero from '../../components/home/ModernHero';
import TrustedBy from '../../components/home/TrustedBy';
import QuickStats from '../../components/home/QuickStats';
import LandingJobSearchSection from '../../components/home/LandingJobSearchSection';
import HowItWorks from '../../components/home/HowItWorks';
import MarketInsights from '../../components/home/MarketInsights';
import BlogSection from '../../components/home/BlogSection';
import Testimonials from '../../components/home/Testimonials';
import CTASection from '../../components/home/CTASection';

const HomePage = () => {
  return (
    <div className="bg-background text-foreground overflow-x-hidden selection:bg-primary/15 selection:text-primary">
      <div className="relative z-[2] min-h-screen flex flex-col">
        <a href="#main-content" className="skip-to-content">
          Chuyển đến nội dung chính
        </a>

        <div id="main-content" className="flex-1">
          <ModernHero />
          <section className="border-y border-slate-200/70 bg-[#f9fafb]">
            <ScrollReveal threshold={0.06}>
              <div className="container mx-auto max-w-6xl px-6 pt-12 md:pt-14">
                <TrustedBy />
                <QuickStats />
              </div>
            </ScrollReveal>
          </section>

          <ScrollReveal threshold={0.08}>
            <LandingJobSearchSection />
          </ScrollReveal>

          <ScrollReveal threshold={0.1}>
            <HowItWorks />
          </ScrollReveal>

          <ScrollReveal threshold={0.1}>
            <MarketInsights />
          </ScrollReveal>

          <ScrollReveal threshold={0.1}>
            <BlogSection />
          </ScrollReveal>

          <ScrollReveal threshold={0.1}>
            <Testimonials />
          </ScrollReveal>

          <div className="pb-16">
            <ScrollReveal threshold={0.1} animation="scale">
              <CTASection />
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
