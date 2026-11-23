import React, { useContext, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';
import AmbientBackground from '../components/landing/AmbientBackground';
import SpotlightCard from '../components/landing/SpotlightCard';
import SpatialHeroCanvas from '../components/landing/SpatialHeroCanvas';

const Home = () => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const [activeFaq, setActiveFaq] = useState(null);
  const containerRef = useRef(null);

  // Parallax Scroll Effects
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -60]);

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.08 }
    }
  };

  const faqs = [
    { question: "Is TaskFlow really free?", answer: "Yes! We offer a generous free tier that includes unlimited tasks, basic boards, and up to 3 collaborators." },
    { question: "Can I upgrade or downgrade anytime?", answer: "Absolutely. You can change your plan at any time. Your prorated balance will be applied to your next billing cycle." },
    { question: "Does TaskFlow support dark mode?", answer: "Yes, TaskFlow comes with an ultra-premium crafted dark mode that syncs with your system preferences." },
    { question: "How secure is my data?", answer: "We use industry-standard AES-256 encryption for data at rest and TLS 1.3 for data in transit. Your data is safe with us." }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 dark:bg-[#07080b] text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-500 overflow-x-hidden relative selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-200">
      
      {/* 1. Spatial Ambient Lighting & 3D Perspective Grid Background */}
      <AmbientBackground />

      {/* 2. Ultra-Luxury Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-[#07080b]/70 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">TaskFlow</span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hidden sm:inline-block">
              3D Spatial
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 lg:gap-8">
            <a href="#features" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">Features</a>
            <a href="#how-it-works" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">How it Works</a>
            <a href="#pricing" className="px-3 py-1.5 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">Pricing</a>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <LanguageToggle />
            <div className="w-px h-5 bg-zinc-200 dark:bg-white/10 hidden sm:block"></div>
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors duration-200"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <Link to="/login" className="hidden sm:block text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors">
              {t('nav.login')}
            </Link>
            <Link to="/register" className="text-sm font-semibold px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full hover:scale-105 hover:shadow-[0_10px_25px_rgba(99,102,241,0.25)] dark:hover:shadow-[0_10px_25px_rgba(255,255,255,0.25)] transition-all duration-300">
              {t('nav.register')}
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-16 relative z-10">
        
        {/* 3. Flagship 3D Spatial Hero Section */}
        <section className="px-4 sm:px-6 min-h-[92vh] flex flex-col items-center justify-center text-center pt-16 pb-12">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-5xl mx-auto relative z-20 flex flex-col items-center"
          >
            {/* 3D Introducing Pill Badge */}
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-indigo-500/20 dark:border-white/10 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm font-bold tracking-wide mb-8 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 font-extrabold">TaskFlow 3D Spatial</span>
              <span className="text-zinc-400 dark:text-zinc-500">•</span>
              <span>The Next-Gen Multi-Million Dollar Workspace</span>
            </motion.div>
            
            {/* Hero Main Headline */}
            <motion.h1 variants={fadeIn} className="text-5xl sm:text-6xl md:text-[5.5rem] font-black tracking-tight text-zinc-900 dark:text-white leading-[1.08] mb-8">
              Work moves faster <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-400 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-400">
                in three dimensions.
              </span>
            </motion.h1>
            
            {/* Hero Subtitle */}
            <motion.p variants={fadeIn} className="text-lg sm:text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-3xl mx-auto leading-relaxed font-normal">
              Đỉnh cao quản trị công việc kết hợp <strong className="text-zinc-900 dark:text-white font-semibold">Trí tuệ nhân tạo Gemini</strong>, không gian tương tác 3D đa tầng và hệ thống Gamification tạo động lực tức thì.
            </motion.p>
            
            {/* CTA Action Buttons */}
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full">
              <Link to="/register" className="w-full sm:w-auto px-9 py-4 sm:py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base sm:text-lg rounded-full hover:scale-105 transition-all duration-300 shadow-[0_15px_35px_rgba(99,102,241,0.4)] flex items-center justify-center gap-3 group">
                Bắt đầu Trải Nghiệm Miễn Phí
                <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
              <a href="#features" className="w-full sm:w-auto px-8 py-4 sm:py-5 bg-white/80 dark:bg-zinc-900/80 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 font-bold text-base sm:text-lg rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800/80 backdrop-blur-md transition-all duration-300 shadow-sm flex items-center justify-center gap-2">
                Khám phá Tính năng 3D
              </a>
            </motion.div>
            
            <motion.div variants={fadeIn} className="mt-8 text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-4">
              <span>⚡ Không cần thẻ tín dụng</span>
              <span>•</span>
              <span>🎁 Tặng trọn gói trợ lý Gemini AI</span>
            </motion.div>
          </motion.div>

          {/* 4. Interactive 3D Spatial Canvas Stage */}
          <motion.div 
            style={{ y: heroY }}
            initial={{ opacity: 0, y: 70, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full mt-14 sm:mt-20 relative z-20"
          >
            <SpatialHeroCanvas />
          </motion.div>
        </section>

        {/* 5. Trusted By Social Proof */}
        <section className="py-14 bg-zinc-100/60 dark:bg-black/40 border-y border-zinc-200/80 dark:border-white/5 overflow-hidden relative z-20">
          <div className="max-w-7xl mx-auto px-6 mb-8 text-center flex flex-col items-center">
             <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">Được tin dùng bởi hơn 10,000+ chuyên gia công nghệ & doanh nghiệp</p>
             <div className="flex gap-1 mb-2 text-amber-400">
               {[1,2,3,4,5].map(star => (
                 <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
               ))}
             </div>
             <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">4.9/5 điểm đánh giá từ 2,000+ phản hồi trên Product Hunt & G2</p>
          </div>
          <div className="flex gap-20 whitespace-nowrap px-6 opacity-60 dark:opacity-40 hover:opacity-100 transition-opacity duration-500 grayscale">
            <div className="animate-[marquee_25s_linear_infinite] flex gap-24 items-center">
               <span className="text-3xl font-black text-zinc-800 dark:text-white tracking-wider">VORTEX</span>
               <span className="text-3xl font-black text-zinc-800 dark:text-white tracking-wider">NEXUS</span>
               <span className="text-3xl font-black text-zinc-800 dark:text-white tracking-wider">HYPERION</span>
               <span className="text-3xl font-black text-zinc-800 dark:text-white tracking-wider">SYNTHEX</span>
               <span className="text-3xl font-black text-zinc-800 dark:text-white tracking-wider">ORBITAL</span>
               <span className="text-3xl font-black text-zinc-800 dark:text-white tracking-wider">AETHER</span>
            </div>
            <div className="animate-[marquee_25s_linear_infinite] flex gap-24 items-center" aria-hidden="true">
               <span className="text-3xl font-black text-zinc-800 dark:text-white tracking-wider">VORTEX</span>
               <span className="text-3xl font-black text-zinc-800 dark:text-white tracking-wider">NEXUS</span>
               <span className="text-3xl font-black text-zinc-800 dark:text-white tracking-wider">HYPERION</span>
               <span className="text-3xl font-black text-zinc-800 dark:text-white tracking-wider">SYNTHEX</span>
               <span className="text-3xl font-black text-zinc-800 dark:text-white tracking-wider">ORBITAL</span>
               <span className="text-3xl font-black text-zinc-800 dark:text-white tracking-wider">AETHER</span>
            </div>
          </div>
        </section>

        {/* 6. Spotlight Bento Grid Features (3D Glowing Architecture) */}
        <section id="features" className="py-28 px-4 sm:px-6 max-w-7xl mx-auto relative z-20">
          <div className="max-w-3xl mb-20 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-4 border border-indigo-500/20">
              💎 Kiến trúc triệu đô
            </div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight mb-6"
            >
              Mọi thứ bạn cần.<br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">
                Chính xác từng miligiây.
              </span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.1 }}
              className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed"
            >
              Thiết kế theo triết lý tối giản công thái học, loại bỏ hoàn toàn các nút bấm thừa. Mọi thao tác đều được tính toán để mang lại cảm giác thỏa mãn nhất.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-7">
            
            {/* Feature 1: AI Copilot (Voice & Document-to-Task) - 7 Cols */}
            <SpotlightCard 
              className="md:col-span-7"
              spotlightColor="rgba(129, 140, 248, 0.22)"
              borderColor="rgba(99, 102, 241, 0.5)"
            >
              <div className="p-8 sm:p-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
                      <span>✨</span> Gemini 3.6 Flash
                    </span>
                    <span className="text-xs font-mono text-zinc-400">Response ~400ms</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-3">
                    Trợ Lý AI Ghi Âm & Phân Rã Tài Liệu
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed mb-6">
                    Không cần gõ phím. Bấm ghi âm hoặc tải lên file PDF/Word/Excel, AI sẽ tự động phân tích ngữ cảnh, bóc tách Tiêu đề, Hạn chót, Mức độ ưu tiên và lên Timeline chi tiết.
                  </p>
                </div>

                {/* Interactive Simulated Voice & NLP Box */}
                <div className="rounded-2xl bg-zinc-100/90 dark:bg-black/60 border border-zinc-200 dark:border-white/10 p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                        🎙️
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Live Voice Input</span>
                    </div>
                    {/* Simulated Dancing Audio Waveform */}
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
                    "Nhắc tôi gửi báo cáo quý cho anh Hưng lúc 3 giờ chiều mai, mức độ khẩn cấp."
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5">
                      <span className="text-[10px] text-zinc-400 block font-mono">TASK</span>
                      <span className="font-semibold text-zinc-900 dark:text-white truncate block">Gửi báo cáo Q3</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5">
                      <span className="text-[10px] text-zinc-400 block font-mono">DUE TIME</span>
                      <span className="font-semibold text-indigo-500 dark:text-indigo-400">15:00 Ngày Mai</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-zinc-400 block font-mono">PRIORITY</span>
                      <span className="font-semibold text-rose-500 flex items-center gap-1">🔥 Khẩn cấp</span>
                    </div>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Feature 2: 3D Spatial Kanban - 5 Cols */}
            <SpotlightCard 
              className="md:col-span-5"
              spotlightColor="rgba(45, 212, 191, 0.2)"
              borderColor="rgba(20, 184, 166, 0.5)"
            >
              <div className="p-8 sm:p-10 flex flex-col h-full justify-between">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 inline-block mb-4">
                    📋 120 FPS Fluid Drag
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-3">
                    Kanban Kéo & Thả 3D
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed mb-6">
                    Tương tác kéo thả xúc giác mượt mà được tăng tốc bằng GPU. Card nhấc bổng khỏi mặt phẳng và nghiêng theo gia tốc ngón tay.
                  </p>
                </div>

                {/* Mini Kanban Columns Preview */}
                <div className="rounded-2xl bg-zinc-100/90 dark:bg-black/60 border border-zinc-200 dark:border-white/10 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-zinc-500">Đang làm</span>
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      </div>
                      <motion.div 
                        whileHover={{ y: -4, rotateZ: 1 }}
                        className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/40 shadow-sm cursor-grab"
                      >
                        <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Audit UI/UX Mobile</p>
                        <span className="text-[10px] text-indigo-500 font-mono mt-1 block">⏱️ 2h còn lại</span>
                      </motion.div>
                    </div>

                    <div className="rounded-xl p-3 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-zinc-500">Hoàn thành</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 opacity-80">
                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 line-through">Release v2.0</p>
                        <span className="text-[10px] text-emerald-500 font-mono mt-1 block">🎉 +120 XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Feature 3: Pomodoro & Time Analytics - 5 Cols */}
            <SpotlightCard 
              className="md:col-span-5"
              spotlightColor="rgba(244, 63, 94, 0.2)"
              borderColor="rgba(244, 63, 94, 0.5)"
            >
              <div className="p-8 sm:p-10 flex flex-col h-full justify-between">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 inline-block mb-4">
                    🍅 Đồng Hồ Tập Trung
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-3">
                    Pomodoro & Phân Tích Giờ
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed mb-6">
                    Ghi nhận tự động số phiên tập trung cho từng Task. Biểu đồ thời gian trực quan giúp bạn nhận diện chính xác nguồn năng lượng đã tiêu hao.
                  </p>
                </div>

                {/* Mini Pomodoro Graphic */}
                <div className="rounded-2xl bg-zinc-100/90 dark:bg-black/60 border border-zinc-200 dark:border-white/10 p-5 flex items-center justify-between">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="rgba(244,63,94,0.15)" strokeWidth="6" fill="none" />
                      <circle cx="40" cy="40" r="32" stroke="#f43f5e" strokeWidth="6" strokeDasharray="200" strokeDashoffset="50" strokeLinecap="round" fill="none" />
                    </svg>
                    <span className="absolute text-sm font-black font-mono text-zinc-900 dark:text-white">25:00</span>
                  </div>
                  <div className="space-y-1.5 flex-1 pl-5 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-zinc-500">Học tập & R&D</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">65%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                      <div className="w-[65%] h-full bg-rose-500 rounded-full" />
                    </div>
                    <p className="text-[11px] text-zinc-400 pt-1">Đã hoàn thành 6 phiên hôm nay</p>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Feature 4: Gamification & Dopamine Rewards - 7 Cols */}
            <SpotlightCard 
              className="md:col-span-7"
              spotlightColor="rgba(245, 158, 11, 0.22)"
              borderColor="rgba(245, 158, 11, 0.5)"
            >
              <div className="p-8 sm:p-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                      <span>🏆</span> Gamification Engine
                    </span>
                    <span className="text-xs font-mono text-amber-500 font-bold">14-Day Streak 🔥</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-3">
                    Trò Chơi Hóa & Thưởng Dopamine Đã Mắt
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed mb-6">
                    Biến việc hoàn thành task thành trò chơi hào hứng. Pháo hoa bung nổ, âm thanh "Ting" tinh tế, tích lũy điểm kinh nghiệm và thăng cấp huy hiệu mỗi ngày.
                  </p>
                </div>

                {/* Gamification Dashboard Widget */}
                <div className="rounded-2xl bg-zinc-100/90 dark:bg-black/60 border border-zinc-200 dark:border-white/10 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                        🏅
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Cấp 8: Bậc Thầy Năng Suất</h4>
                        <p className="text-[11px] text-zinc-500">Top 1% người dùng tuần này</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
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
              </div>
            </SpotlightCard>

            {/* Feature 5: Real-time Collaboration & Shortcuts - 12 Cols */}
            <SpotlightCard 
              className="md:col-span-12"
              spotlightColor="rgba(99, 102, 241, 0.18)"
              borderColor="rgba(129, 140, 248, 0.4)"
            >
              <div className="p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 inline-block mb-4">
                    ⚡ Zero Latency Productivity
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
                    Phím Tắt Thần Tốc & Cộng Tác Trực Tuyến
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-6">
                    Điều khiển mọi luồng công việc mà không cần rời tay khỏi bàn phím như một lập trình viên lão luyện. Nhấn phím để mở menu tìm kiếm, đổi giao diện hoặc thêm nhanh nhiệm vụ.
                  </p>
                  
                  {/* Keyboard Shortcut Badges */}
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { key: '⌘ + K', label: 'Tìm kiếm đa năng' },
                      { key: 'C', label: 'Tạo Task mới' },
                      { key: 'D', label: 'Đổi Dark / Light' },
                      { key: 'P', label: 'Bật Pomodoro' },
                    ].map((sc, i) => (
                      <div key={i} className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs flex items-center gap-2">
                        <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-black font-mono font-bold text-zinc-800 dark:text-zinc-200 shadow-sm border border-zinc-200 dark:border-white/10">
                          {sc.key}
                        </kbd>
                        <span className="text-zinc-600 dark:text-zinc-400 font-medium">{sc.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 rounded-2xl bg-zinc-100/90 dark:bg-black/60 border border-zinc-200 dark:border-white/10 p-6 relative overflow-hidden min-h-[220px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
                  
                  {/* Simulated Moving Cursors */}
                  <motion.div 
                    animate={{ x: [0, 40, 20, 0], y: [0, -20, 10, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-1/4 left-1/4 flex items-center gap-2 z-10"
                  >
                    <svg className="w-5 h-5 text-indigo-500 fill-current drop-shadow" viewBox="0 0 24 24"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold shadow">Minh (Tech Lead)</span>
                  </motion.div>

                  <motion.div 
                    animate={{ x: [0, -35, -15, 0], y: [0, 25, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className="absolute bottom-1/3 right-1/4 flex items-center gap-2 z-10"
                  >
                    <svg className="w-5 h-5 text-purple-500 fill-current drop-shadow" viewBox="0 0 24 24"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold shadow">Sarah (UI Designer)</span>
                  </motion.div>

                  <div className="text-center relative z-20">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl mx-auto mb-3 shadow-[0_0_25px_rgba(99,102,241,0.5)]">
                      🚀
                    </div>
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Đồng Bộ Trực Tiếp Đa Nền Tảng</h4>
                    <p className="text-xs text-zinc-500 mt-1">Web, Mobile và Desktop luôn khớp dữ liệu từng giây</p>
                  </div>
                </div>
              </div>
            </SpotlightCard>

          </div>
        </section>

        {/* 7. How It Works Section (3D Spatial Workflow Steps) */}
        <section id="how-it-works" className="py-28 px-4 sm:px-6 relative z-20 bg-zinc-100/60 dark:bg-black/40 border-y border-zinc-200/80 dark:border-white/5">
           <div className="max-w-7xl mx-auto">
             <div className="text-center mb-20">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-4 border border-indigo-500/20">
                 ⚡ Quy trình 3 bước tối ưu
               </div>
               <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
                 Khởi đầu chỉ trong 3 bước
               </h2>
               <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                 Từ ý tưởng mơ hồ đến kết quả hoàn hảo. TaskFlow được thiết kế để không làm lãng phí một giây nào của bạn.
               </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { 
                    step: "BƯỚC 01", 
                    title: "Tạo Không Gian Làm Việc", 
                    desc: "Khởi tạo workspace thông minh chỉ trong vài giây. Tùy biến các danh mục dự án, phân quyền cộng sự an toàn.",
                    image: "/images/step_workspace_3d.jpg",
                    tag: "Isometric Workspace",
                    spotlight: "rgba(6, 182, 212, 0.25)",
                    border: "rgba(6, 182, 212, 0.5)",
                    badgeColor: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
                  },
                  { 
                    step: "BƯỚC 02", 
                    title: "Để AI Lập Kế Hoạch & Phân Rã", 
                    desc: "Chỉ cần ghi âm hoặc tải file PDF/Word. Trợ lý Gemini AI tự động bóc tách thành các đầu việc nhỏ, gắn deadline và mức độ ưu tiên.",
                    image: "/images/step_ai_planner_3d.jpg",
                    tag: "Gemini Neural Core",
                    spotlight: "rgba(168, 85, 247, 0.25)",
                    border: "rgba(168, 85, 247, 0.5)",
                    badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                  },
                  { 
                    step: "BƯỚC 03", 
                    title: "Chinh Phục & Nhận Thưởng", 
                    desc: "Theo dõi tiến độ Kanban 3D mượt mà, bật Pomodoro tập trung sâu và thu thập XP thăng cấp huy hiệu vinh quang.",
                    image: "/images/step_gamification_3d.jpg",
                    tag: "Gamification & XP",
                    spotlight: "rgba(245, 158, 11, 0.25)",
                    border: "rgba(245, 158, 11, 0.5)",
                    badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  }
                ].map((item, idx) => (
                  <SpotlightCard
                    key={idx}
                    spotlightColor={item.spotlight}
                    borderColor={item.border}
                    className="p-6 sm:p-7 flex flex-col justify-between group"
                  >
                    <div>
                      {/* 3D Image Showcase Container */}
                      <div className="w-full aspect-square rounded-2xl overflow-hidden relative mb-6 border border-zinc-200/80 dark:border-white/10 bg-black/60 shadow-lg">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                        
                        {/* Step Pill Overlay */}
                        <div className="absolute top-4 left-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase backdrop-blur-md border ${item.badgeColor}`}>
                            {item.step}
                          </span>
                        </div>

                        {/* Tag Pill Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/90">
                          <span className="font-semibold bg-black/60 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10">
                            {item.tag}
                          </span>
                          <span className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
                            →
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-3 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-6 mt-6 border-t border-zinc-200/80 dark:border-white/10 flex items-center justify-between text-xs text-zinc-500">
                      <span>✓ Tích hợp sẵn</span>
                      <span className="font-mono text-indigo-500 dark:text-indigo-400 font-semibold">Tự động 100%</span>
                    </div>
                  </SpotlightCard>
                ))}
             </div>
           </div>
        </section>

        {/* 8. Pricing Plans */}
        <section id="pricing" className="py-28 px-4 sm:px-6 relative z-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">Minh bạch. Không rủi ro.</h2>
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">Gói miễn phí đầy đủ tính năng cốt lõi. Nâng cấp bất cứ lúc nào khi nhóm của bạn sẵn sàng bứt phá.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
               
               <SpotlightCard className="p-8 sm:p-12">
                 <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Gói Khởi Động (Starter)</h3>
                 <div className="flex items-baseline gap-2 mb-6">
                   <span className="text-6xl font-black text-zinc-900 dark:text-white">$0</span>
                   <span className="text-zinc-500 text-base font-medium">/ trọn đời</span>
                 </div>
                 <p className="text-zinc-600 dark:text-zinc-400 text-base mb-8 border-b border-zinc-200 dark:border-white/10 pb-6">Hoàn hảo cho sinh viên, cá nhân quản lý công việc và mục tiêu hàng ngày.</p>
                 <ul className="flex flex-col gap-4 mb-10 flex-1">
                   {["Không giới hạn số lượng Task", "Bảng Kanban kéo thả mượt mà", "Đồng hồ Pomodoro tập trung", "Trợ lý AI cơ bản", "Lịch trực quan & Dark mode"].map((item, i) => (
                     <li key={i} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300 font-medium text-sm">
                       <div className="w-5 h-5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0 text-xs">
                         ✓
                       </div>
                       {item}
                     </li>
                   ))}
                 </ul>
                 <Link to="/register" className="block w-full py-4 text-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-bold hover:bg-zinc-200 dark:hover:bg-white/15 transition-colors">
                   Bắt Đầu Miễn Phí
                 </Link>
               </SpotlightCard>

               <SpotlightCard 
                 className="p-8 sm:p-12 md:scale-105 z-10"
                 spotlightColor="rgba(99, 102, 241, 0.3)"
                 borderColor="rgba(129, 140, 248, 0.6)"
               >
                 <div className="inline-block self-start px-3.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md mb-6">
                   Khuyên Dùng • Pro AI
                 </div>
                 <div className="flex items-baseline gap-2 mb-6">
                   <span className="text-6xl font-black text-zinc-900 dark:text-white">$12</span>
                   <span className="text-zinc-400 text-base font-medium">/ người dùng / tháng</span>
                 </div>
                 <p className="text-zinc-600 dark:text-zinc-400 text-base mb-8 border-b border-zinc-200 dark:border-white/10 pb-6">Dành cho các chuyên gia và team đòi hỏi AI siêu tốc, phân tích chuyên sâu.</p>
                 <ul className="flex flex-col gap-4 mb-10 flex-1">
                   {["Toàn bộ tính năng gói Starter", "Trợ lý AI Gemini 3.6 Flash không giới hạn", "Tải file PDF/Word/Excel tự lên Timeline", "Email nhắc việc tự động 8:00 AM mỗi ngày", "Gamification đầy đủ & Thống kê chuyên sâu", "Hỗ trợ ưu tiên 24/7"].map((item, i) => (
                     <li key={i} className="flex items-center gap-3 text-zinc-800 dark:text-zinc-200 font-medium text-sm">
                       <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 text-xs shadow-sm">
                         ✓
                       </div>
                       {item}
                     </li>
                   ))}
                 </ul>
                 <Link to="/register" className="block w-full py-4 text-center rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-[0_10px_25px_rgba(99,102,241,0.4)]">
                   Nâng Cấp Gói Pro
                 </Link>
               </SpotlightCard>
            </div>
          </div>
        </section>

        {/* 9. FAQs Section */}
        <section className="py-24 px-6 max-w-4xl mx-auto relative z-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white mb-3">Câu Hỏi Thường Gặp</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-base">Giải đáp nhanh các thắc mắc về bảo mật, tính năng và lộ trình sử dụng.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i}
                className="rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-zinc-900 dark:text-white text-base hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <span>{faq.question}</span>
                  <span className={`transform transition-transform duration-300 text-xl ${activeFaq === i ? 'rotate-180 text-indigo-500' : 'text-zinc-400'}`}>
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
                      className="px-6 pb-6 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-white/5 pt-3"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* 10. Massive CTA Banner */}
        <section className="py-20 px-4 sm:px-6 relative z-20">
          <div className="max-w-6xl mx-auto rounded-[3rem] bg-gradient-to-tr from-indigo-950/80 via-black to-purple-950/70 border border-indigo-500/30 p-10 sm:p-16 text-center relative overflow-hidden shadow-[0_30px_90px_rgba(99,102,241,0.3)]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
                Sẵn sàng nâng tầm quy trình làm việc của bạn?
              </h2>
              <p className="text-lg sm:text-xl text-zinc-300 mb-10 leading-relaxed font-normal">
                Tham gia cùng hàng nghìn người dùng đã tăng 200% năng suất mỗi ngày với TaskFlow.
              </p>
              <Link to="/register" className="inline-flex items-center justify-center px-10 py-5 text-base sm:text-lg font-bold text-zinc-900 bg-white hover:bg-zinc-100 rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_20px_40px_rgba(255,255,255,0.25)]">
                Bắt Đầu Ngay Hôm Nay
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* 11. Minimalist Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/10 bg-zinc-100/60 dark:bg-black/80 relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">TaskFlow</span>
            <span className="text-xs text-zinc-500 ml-2">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}} />
    </div>
  );
};

export default Home;
