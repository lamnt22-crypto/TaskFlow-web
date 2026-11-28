import React, { useContext, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';
import AmbientBackground from '../components/landing/AmbientBackground';
import SpotlightCard from '../components/landing/SpotlightCard';
import SpatialHeroCanvas from '../components/landing/SpatialHeroCanvas';

const STEP_MEDIA = [
  {
    image: '/images/step_workspace_3d.jpg',
    icon: '🗂️',
    spotlight: 'rgba(6, 182, 212, 0.22)',
    border: 'rgba(6, 182, 212, 0.5)',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
  },
  {
    image: '/images/step_ai_planner_3d.jpg',
    icon: '🧠',
    spotlight: 'rgba(168, 85, 247, 0.22)',
    border: 'rgba(168, 85, 247, 0.5)',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
  },
  {
    image: '/images/step_gamification_3d.jpg',
    icon: '🏆',
    spotlight: 'rgba(245, 158, 11, 0.22)',
    border: 'rgba(245, 158, 11, 0.5)',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  },
];

const Home = () => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [activeFaq, setActiveFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [failedStepImages, setFailedStepImages] = useState({});
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -60]);

  const fadeIn = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.06 },
    },
  };

  const translatedSteps = t('landing.howItWorks.steps', { returnObjects: true });
  const stepsList = Array.isArray(translatedSteps) ? translatedSteps : [];

  const translatedStarterFeatures = t('landing.pricing.starter.features', { returnObjects: true });
  const starterFeatures = Array.isArray(translatedStarterFeatures) ? translatedStarterFeatures : [];

  const translatedProFeatures = t('landing.pricing.pro.features', { returnObjects: true });
  const proFeatures = Array.isArray(translatedProFeatures) ? translatedProFeatures : [];

  const translatedFaqs = t('landing.faq.items', { returnObjects: true });
  const faqs = Array.isArray(translatedFaqs) ? translatedFaqs : [];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50 dark:bg-[#07080b] text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-500 overflow-x-clip relative selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-200"
    >
      {/* 1. Spatial Ambient Lighting & 3D Perspective Grid Background */}
      <AmbientBackground />

      {/* 2. Ultra-Luxury Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#07080b]/80 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span translate="no" className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              TaskFlow
            </span>
            <span translate="no" className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hidden sm:inline-block">
              3D Spatial
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2 lg:gap-8">
            <a href="#features" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">
              {t('landing.nav.features')}
            </a>
            <a href="#how-it-works" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">
              {t('landing.nav.howItWorks')}
            </a>
            <a href="#pricing" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">
              {t('landing.nav.pricing')}
            </a>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>
            <div className="w-px h-5 bg-zinc-200 dark:bg-white/10 hidden sm:block" />
            <button
              onClick={toggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors duration-200"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <Link to="/login" className="hidden md:block text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors px-2">
              {t('nav.login')}
            </Link>
            <Link to="/register" className="hidden sm:inline-flex text-xs sm:text-sm font-semibold px-4 sm:px-6 py-2 sm:py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full hover:scale-105 hover:shadow-[0_10px_25px_rgba(99,102,241,0.25)] dark:hover:shadow-[0_10px_25px_rgba(255,255,255,0.25)] transition-all duration-300 whitespace-nowrap">
              {t('nav.register')}
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-zinc-200/80 dark:border-white/10 bg-white/95 dark:bg-[#07080b]/95 backdrop-blur-2xl"
            >
              <div className="px-4 py-4 space-y-2">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5">
                  {t('landing.nav.features')}
                </a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5">
                  {t('landing.nav.howItWorks')}
                </a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5">
                  {t('landing.nav.pricing')}
                </a>
                <div className="pt-2 border-t border-zinc-200/80 dark:border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between px-3 py-1 sm:hidden">
                    <span className="text-xs font-semibold text-zinc-500">{t('landing.nav.language')}</span>
                    <LanguageToggle />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-center rounded-xl text-sm font-semibold border border-zinc-200 dark:border-white/15 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/5">
                      {t('nav.login')}
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-center rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm">
                      {t('nav.register')}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="pt-20 sm:pt-24 pb-16 relative z-10">
        {/* 3. Flagship 3D Spatial Hero Section */}
        <section className="px-4 sm:px-6 lg:min-h-[88vh] flex flex-col items-center justify-center text-center pt-8 sm:pt-14 pb-10 sm:pb-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-5xl mx-auto relative z-20 flex flex-col items-center"
          >
            {/* 3D Introducing Pill Badge */}
            <motion.div variants={fadeIn} className="inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/85 dark:bg-zinc-900/70 backdrop-blur-xl border border-indigo-500/20 dark:border-white/10 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm font-bold tracking-wide mb-6 sm:mb-8 shadow-sm max-w-full">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
              <span translate="no" className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 font-extrabold">
                {t('landing.hero.badgeBrand')}
              </span>
              <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">•</span>
              <span className="text-[11px] sm:text-sm text-zinc-600 dark:text-zinc-300">{t('landing.hero.badgeTag')}</span>
            </motion.div>

            {/* Hero Main Headline */}
            <motion.h1 variants={fadeIn} className="text-[2.25rem] leading-[1.12] sm:text-6xl md:text-7xl lg:text-[5rem] font-black tracking-tight text-zinc-900 dark:text-white sm:leading-[1.08] mb-5 sm:mb-8">
              {t('landing.hero.headlineTop')} <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-400 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-400">
                {t('landing.hero.headlineGradient')}
              </span>
            </motion.h1>

            {/* Hero Subtitle */}
            <motion.p variants={fadeIn} className="text-base sm:text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed font-normal px-1">
              {t('landing.hero.subtitlePrefix')}{' '}
              <strong translate="no" className="text-zinc-900 dark:text-white font-semibold">
                {t('landing.hero.subtitleBrand')}
              </strong>
              {t('landing.hero.subtitleSuffix')}
            </motion.p>

            {/* CTA Action Buttons */}
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-3.5 sm:gap-6 justify-center items-center w-full max-w-md sm:max-w-none">
              <Link to="/register" className="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm sm:text-lg rounded-full hover:scale-105 transition-all duration-300 shadow-[0_15px_35px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2.5 sm:gap-3 group">
                {t('landing.hero.ctaPrimary')}
                <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <a href="#features" className="w-full sm:w-auto px-7 sm:px-8 py-3.5 sm:py-4.5 bg-white/85 dark:bg-zinc-900/80 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 font-bold text-sm sm:text-lg rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800/80 backdrop-blur-md transition-all duration-300 shadow-sm flex items-center justify-center gap-2">
                {t('landing.hero.ctaSecondary')}
              </a>
            </motion.div>

            <motion.div variants={fadeIn} className="mt-6 sm:mt-8 text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>{t('landing.hero.hintNoCard')}</span>
              <span className="hidden sm:inline">•</span>
              <span>{t('landing.hero.hintGemini')}</span>
            </motion.div>
          </motion.div>

          {/* 4. Interactive 3D Spatial Canvas Stage */}
          <motion.div
            style={{ y: heroY }}
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full mt-10 sm:mt-16 lg:mt-20 relative z-20"
          >
            <SpatialHeroCanvas />
          </motion.div>
        </section>

        {/* 5. Trusted By Social Proof */}
        <section className="py-10 sm:py-14 bg-zinc-100/60 dark:bg-black/40 border-y border-zinc-200/80 dark:border-white/5 overflow-hidden relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8 text-center flex flex-col items-center">
            <p className="text-[11px] sm:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
              {t('landing.proof.trustedBy')}
            </p>
            <div className="flex gap-1 mb-2 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm font-medium">{t('landing.proof.rating')}</p>
          </div>
          <div className="overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div translate="no" className="flex w-max gap-12 sm:gap-20 whitespace-nowrap px-6 opacity-60 dark:opacity-40 hover:opacity-100 transition-opacity duration-500 grayscale">
              <div className="animate-[marquee_25s_linear_infinite] flex gap-12 sm:gap-24 items-center">
                <span className="text-xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-wider">VORTEX</span>
                <span className="text-xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-wider">NEXUS</span>
                <span className="text-xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-wider">HYPERION</span>
                <span className="text-xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-wider">SYNTHEX</span>
                <span className="text-xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-wider">ORBITAL</span>
                <span className="text-xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-wider">AETHER</span>
              </div>
              <div className="animate-[marquee_25s_linear_infinite] flex gap-12 sm:gap-24 items-center" aria-hidden="true">
                <span className="text-xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-wider">VORTEX</span>
                <span className="text-xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-wider">NEXUS</span>
                <span className="text-xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-wider">HYPERION</span>
                <span className="text-xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-wider">SYNTHEX</span>
                <span className="text-xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-wider">ORBITAL</span>
                <span className="text-xl sm:text-3xl font-black text-zinc-800 dark:text-white tracking-wider">AETHER</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Spotlight Bento Grid Features (3D Glowing Architecture) */}
        <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-20">
          <div className="max-w-3xl mb-12 sm:mb-16 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-4 border border-indigo-500/20">
              {t('landing.features.eyebrow')}
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              className="text-3xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight mb-5 sm:mb-6"
            >
              {t('landing.features.titleLine1')}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">
                {t('landing.features.titleLine2')}
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: 0.1 }}
              className="text-base sm:text-xl text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed"
            >
              {t('landing.features.subtitle')}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-7">
            {/* Feature 1: AI Copilot - 7 Cols */}
            <SpotlightCard
              className="md:col-span-7"
              contentClassName="p-6 sm:p-9 flex flex-col justify-between h-full"
              spotlightColor="rgba(129, 140, 248, 0.2)"
              borderColor="rgba(99, 102, 241, 0.5)"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <span translate="no" className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
                    <span>✨</span> {t('landing.features.ai.badge')}
                  </span>
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{t('landing.features.ai.latency')}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-3">
                  {t('landing.features.ai.title')}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed mb-6">
                  {t('landing.features.ai.desc')}
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-white/10 p-4 sm:p-5 backdrop-blur-md">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center text-sm">
                      🎙️
                    </div>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t('landing.features.ai.voiceLabel')}</span>
                  </div>
                  <div className="flex items-center gap-1 h-5">
                    {[18, 28, 14, 32, 22, 12, 26, 16].map((h, i) => (
                      <motion.span
                        key={i}
                        animate={{ height: [6, h, 6] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                        className="w-1 bg-indigo-500 rounded-full"
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 italic mb-4">
                  {t('landing.features.ai.sampleQuote')}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5">
                    <span className="text-[10px] text-zinc-400 block font-mono">{t('landing.features.ai.taskLabel')}</span>
                    <span className="font-semibold text-zinc-900 dark:text-white truncate block">{t('landing.features.ai.taskValue')}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5">
                    <span className="text-[10px] text-zinc-400 block font-mono">{t('landing.features.ai.dueLabel')}</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{t('landing.features.ai.dueValue')}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-zinc-400 block font-mono">{t('landing.features.ai.priorityLabel')}</span>
                    <span className="font-semibold text-rose-500 flex items-center gap-1">{t('landing.features.ai.priorityValue')}</span>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Feature 2: 3D Spatial Kanban - 5 Cols */}
            <SpotlightCard
              className="md:col-span-5"
              contentClassName="p-6 sm:p-9 flex flex-col justify-between h-full"
              spotlightColor="rgba(45, 212, 191, 0.2)"
              borderColor="rgba(20, 184, 166, 0.5)"
            >
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 inline-block mb-4">
                  {t('landing.features.kanban.badge')}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-3">
                  {t('landing.features.kanban.title')}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed mb-6">
                  {t('landing.features.kanban.desc')}
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-white/10 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">{t('landing.features.kanban.colDoing')}</span>
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    </div>
                    <motion.div
                      whileHover={{ y: -4, rotateZ: 1 }}
                      className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/40 shadow-sm cursor-grab"
                    >
                      <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">{t('landing.features.kanban.card1')}</p>
                      <span className="text-[10px] text-indigo-500 font-mono mt-1 block">{t('landing.features.kanban.card1Time')}</span>
                    </motion.div>
                  </div>

                  <div className="rounded-xl p-3 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">{t('landing.features.kanban.colDone')}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 opacity-85">
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 line-through">{t('landing.features.kanban.card2')}</p>
                      <span translate="no" className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">{t('landing.features.kanban.card2Xp')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Feature 3: Pomodoro & Time Analytics - 5 Cols */}
            <SpotlightCard
              className="md:col-span-5"
              contentClassName="p-6 sm:p-9 flex flex-col justify-between h-full"
              spotlightColor="rgba(244, 63, 94, 0.2)"
              borderColor="rgba(244, 63, 94, 0.5)"
            >
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 inline-block mb-4">
                  {t('landing.features.pomodoro.badge')}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-3">
                  {t('landing.features.pomodoro.title')}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed mb-6">
                  {t('landing.features.pomodoro.desc')}
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-white/10 p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" stroke="rgba(244,63,94,0.15)" strokeWidth="6" fill="none" />
                    <circle cx="40" cy="40" r="32" stroke="#f43f5e" strokeWidth="6" strokeDasharray="200" strokeDashoffset="50" strokeLinecap="round" fill="none" />
                  </svg>
                  <span translate="no" className="absolute text-sm font-black font-mono text-zinc-900 dark:text-white">25:00</span>
                </div>
                <div className="space-y-1.5 flex-1 min-w-0 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-zinc-600 dark:text-zinc-400 truncate">{t('landing.features.pomodoro.category')}</span>
                    <span translate="no" className="font-bold text-zinc-800 dark:text-zinc-200">65%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                    <div className="w-[65%] h-full bg-rose-500 rounded-full" />
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">{t('landing.features.pomodoro.sessionsDone')}</p>
                </div>
              </div>
            </SpotlightCard>

            {/* Feature 4: Gamification & Dopamine Rewards - 7 Cols */}
            <SpotlightCard
              className="md:col-span-7"
              contentClassName="p-6 sm:p-9 flex flex-col justify-between h-full"
              spotlightColor="rgba(245, 158, 11, 0.22)"
              borderColor="rgba(245, 158, 11, 0.5)"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <span translate="no" className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                    <span>🏆</span> {t('landing.features.gamification.badge')}
                  </span>
                  <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">{t('landing.features.gamification.streak')}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-3">
                  {t('landing.features.gamification.title')}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed mb-6">
                  {t('landing.features.gamification.desc')}
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-white/10 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.45)] shrink-0">
                      🏅
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{t('landing.features.gamification.rank')}</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t('landing.features.gamification.rankSub')}</p>
                    </div>
                  </div>
                  <span translate="no" className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    1,850 / 2,000 XP
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '92%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                  />
                </div>
              </div>
            </SpotlightCard>

            {/* Feature 5: Real-time Collaboration & Shortcuts - 12 Cols */}
            <SpotlightCard
              className="md:col-span-12"
              contentClassName="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              spotlightColor="rgba(99, 102, 241, 0.18)"
              borderColor="rgba(129, 140, 248, 0.4)"
            >
              <div className="lg:col-span-6">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 inline-block mb-4">
                  {t('landing.features.shortcuts.badge')}
                </span>
                <h3 className="text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                  {t('landing.features.shortcuts.title')}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed mb-6">
                  {t('landing.features.shortcuts.desc')}
                </p>

                <div className="flex flex-wrap gap-2.5">
                  {[
                    { key: '⌘ + K', label: t('landing.features.shortcuts.scSearch') },
                    { key: 'C', label: t('landing.features.shortcuts.scCreate') },
                    { key: 'D', label: t('landing.features.shortcuts.scTheme') },
                    { key: 'P', label: t('landing.features.shortcuts.scPomo') },
                  ].map((sc, i) => (
                    <div key={i} className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs flex items-center gap-2">
                      <kbd translate="no" className="px-2 py-0.5 rounded-md bg-white dark:bg-black font-mono font-bold text-zinc-800 dark:text-zinc-200 shadow-sm border border-zinc-200 dark:border-white/10">
                        {sc.key}
                      </kbd>
                      <span className="text-zinc-600 dark:text-zinc-400 font-medium">{sc.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 rounded-2xl bg-zinc-50 dark:bg-black/60 border border-zinc-200 dark:border-white/10 p-6 relative overflow-hidden min-h-[220px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />

                <motion.div
                  animate={{ x: [0, 30, 15, 0], y: [0, -16, 8, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  className="hidden sm:flex absolute top-6 left-8 items-center gap-2 z-10"
                >
                  <svg className="w-5 h-5 text-indigo-500 fill-current drop-shadow" viewBox="0 0 24 24">
                    <path d="M3 3l7 18 3-7 7-3L3 3z" />
                  </svg>
                  <span translate="no" className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold shadow">
                    Minh (Tech Lead)
                  </span>
                </motion.div>

                <motion.div
                  animate={{ x: [0, -25, -10, 0], y: [0, 18, -8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="hidden sm:flex absolute bottom-6 right-8 items-center gap-2 z-10"
                >
                  <svg className="w-5 h-5 text-purple-500 fill-current drop-shadow" viewBox="0 0 24 24">
                    <path d="M3 3l7 18 3-7 7-3L3 3z" />
                  </svg>
                  <span translate="no" className="px-2.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold shadow">
                    Sarah (UI Designer)
                  </span>
                </motion.div>

                <div className="text-center relative z-20">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl mx-auto mb-3 shadow-[0_0_25px_rgba(99,102,241,0.5)]">
                    🚀
                  </div>
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{t('landing.features.shortcuts.syncTitle')}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{t('landing.features.shortcuts.syncSub')}</p>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </section>

        {/* 7. How It Works Section (3D Spatial Workflow Steps) */}
        <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 relative z-20 bg-zinc-100/70 dark:bg-black/40 border-y border-zinc-200/80 dark:border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-4 border border-indigo-500/20">
                {t('landing.howItWorks.eyebrow')}
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
                {t('landing.howItWorks.title')}
              </h2>
              <p className="text-base sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                {t('landing.howItWorks.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {stepsList.map((item, idx) => {
                const media = STEP_MEDIA[idx] || STEP_MEDIA[0];
                return (
                  <SpotlightCard
                    key={idx}
                    spotlightColor={media.spotlight}
                    borderColor={media.border}
                    className={`h-full group ${idx === 2 ? 'md:col-span-2 md:max-w-md md:mx-auto lg:col-span-1 lg:max-w-none w-full' : 'w-full'}`}
                    contentClassName="p-5 sm:p-6 flex flex-col justify-between h-full"
                  >
                    <div>
                      {/* 3D Image Showcase Container */}
                      <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden relative mb-5 border border-zinc-200/80 dark:border-white/10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-md flex items-center justify-center">
                        {!failedStepImages[idx] ? (
                          <img
                            src={media.image}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            onError={() => setFailedStepImages((prev) => ({ ...prev, [idx]: true }))}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 text-center">
                            <span className="text-5xl mb-3">{media.icon}</span>
                            <span className="text-sm font-bold text-white/90">{item.tag}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

                        {/* Step Pill Overlay */}
                        <div className="absolute top-3 left-3">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase backdrop-blur-md border ${media.badgeColor}`}>
                            {item.step}
                          </span>
                        </div>

                        {/* Tag Pill Overlay */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-xs text-white">
                          <span translate="no" className="font-semibold bg-black/65 px-3 py-1 rounded-lg backdrop-blur-md border border-white/15 truncate">
                            {item.tag}
                          </span>
                          <span className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:translate-x-1 transition-transform">
                            →
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-2.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-4 mt-5 border-t border-zinc-200/80 dark:border-white/10 flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="font-medium">{t('landing.howItWorks.footerLeft')}</span>
                      <span translate="no" className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold whitespace-nowrap">
                        {t('landing.howItWorks.footerRight')}
                      </span>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* 8. Pricing Plans */}
        <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 relative z-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
                {t('landing.pricing.title')}
              </h2>
              <p className="text-base sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                {t('landing.pricing.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
              {/* Starter Card */}
              <SpotlightCard
                className="h-full"
                contentClassName="p-7 sm:p-9 lg:p-10 flex flex-col justify-between h-full"
              >
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                    {t('landing.pricing.starter.name')}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-5">
                    <span translate="no" className="text-5xl font-black text-zinc-900 dark:text-white tabular-nums whitespace-nowrap">
                      {t('landing.pricing.starter.price')}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base font-medium">
                      {t('landing.pricing.starter.period')}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base mb-6 border-b border-zinc-200 dark:border-white/10 pb-6 leading-relaxed">
                    {t('landing.pricing.starter.desc')}
                  </p>
                  <ul className="flex flex-col gap-3.5 mb-8">
                    {starterFeatures.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300 font-medium text-sm">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 text-xs mt-0.5">
                          ✓
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to="/register"
                  className="mt-auto block w-full py-3.5 text-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-bold text-sm sm:text-base hover:bg-zinc-200 dark:hover:bg-white/15 transition-colors"
                >
                  {t('landing.pricing.starter.cta')}
                </Link>
              </SpotlightCard>

              {/* Pro AI Card */}
              <SpotlightCard
                className="h-full ring-1 ring-indigo-500/35 dark:ring-indigo-400/30"
                contentClassName="p-7 sm:p-9 lg:p-10 flex flex-col justify-between h-full"
                spotlightColor="rgba(99, 102, 241, 0.28)"
                borderColor="rgba(129, 140, 248, 0.65)"
              >
                <div>
                  <div className="inline-flex items-center px-3.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md mb-4">
                    {t('landing.pricing.pro.badge')}
                  </div>
                  <div className="flex items-baseline gap-2 mb-5">
                    <span translate="no" className="text-5xl font-black text-zinc-900 dark:text-white tabular-nums whitespace-nowrap">
                      {t('landing.pricing.pro.price')}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base font-medium">
                      {t('landing.pricing.pro.period')}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base mb-6 border-b border-zinc-200 dark:border-white/10 pb-6 leading-relaxed">
                    {t('landing.pricing.pro.desc')}
                  </p>
                  <ul className="flex flex-col gap-3.5 mb-8">
                    {proFeatures.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-zinc-800 dark:text-zinc-200 font-medium text-sm">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5">
                          ✓
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to="/register"
                  className="mt-auto block w-full py-3.5 text-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm sm:text-base hover:from-indigo-500 hover:to-purple-500 transition-all shadow-[0_10px_25px_rgba(99,102,241,0.35)]"
                >
                  {t('landing.pricing.pro.cta')}
                </Link>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* 9. FAQs Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto relative z-20">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white mb-3">{t('landing.faq.title')}</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">{t('landing.faq.subtitle')}</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/90 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-zinc-900 dark:text-white text-sm sm:text-base hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className={`transform transition-transform duration-300 text-xl shrink-0 ${activeFaq === i ? 'rotate-180 text-indigo-500' : 'text-zinc-400'}`}>
                    ▾
                  </span>
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-white/5 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* 10. Massive CTA Banner */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 relative z-20">
          <div className="max-w-6xl mx-auto rounded-3xl sm:rounded-[3rem] bg-gradient-to-tr from-indigo-950/90 via-black to-purple-950/80 border border-indigo-500/30 p-8 sm:p-14 md:p-16 text-center relative overflow-hidden shadow-[0_30px_90px_rgba(99,102,241,0.3)]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-5 sm:mb-6">
                {t('landing.ctaBanner.title')}
              </h2>
              <p className="text-base sm:text-xl text-zinc-300 mb-8 sm:mb-10 leading-relaxed font-normal">
                {t('landing.ctaBanner.subtitle')}
              </p>
              <Link to="/register" className="inline-flex items-center justify-center px-8 sm:px-10 py-4 sm:py-5 text-sm sm:text-lg font-bold text-zinc-900 bg-white hover:bg-zinc-100 rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_20px_40px_rgba(255,255,255,0.25)]">
                {t('landing.ctaBanner.button')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 11. Minimalist Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/10 bg-zinc-100/60 dark:bg-black/80 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span translate="no" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">TaskFlow</span>
            <span className="text-xs text-zinc-500 sm:ml-2">
              © {new Date().getFullYear()} {t('landing.footer.rights')}
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-5 sm:gap-6 text-sm text-zinc-500 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t('landing.nav.features')}</a>
            <a href="#pricing" className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t('landing.nav.pricing')}</a>
            <Link to="/login" className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t('nav.login')}</Link>
            <Link to="/register" className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t('nav.register')}</Link>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-100%); }
          }
        `,
      }} />
    </div>
  );
};

export default Home;
