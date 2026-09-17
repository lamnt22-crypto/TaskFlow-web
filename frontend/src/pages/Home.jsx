import React, { useContext, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';

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

  // Hero Image Parallax
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -150]);
  
  // Background Blob Parallax
  const blob1Y = useTransform(scrollYProgress, [0, 1], [0, 800]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [0, -600]);

  const fadeIn = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const faqs = [
    { question: "Is TaskFlow really free?", answer: "Yes! We offer a generous free tier that includes unlimited tasks, basic boards, and up to 3 collaborators." },
    { question: "Can I upgrade or downgrade anytime?", answer: "Absolutely. You can change your plan at any time. Your prorated balance will be applied to your next billing cycle." },
    { question: "Does TaskFlow support dark mode?", answer: "Yes, TaskFlow comes with a beautifully crafted dark mode that syncs with your system preferences." },
    { question: "How secure is my data?", answer: "We use industry-standard AES-256 encryption for data at rest and TLS 1.3 for data in transit. Your data is safe with us." }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-700 overflow-x-hidden relative selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-200">
      
      {/* Refined Parallax Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-white dark:bg-[#0a0a0a]">
        <motion.div style={{ y: blob1Y }} className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <motion.div style={{ y: blob2Y }} className="absolute top-[30%] right-[-10%] w-[900px] h-[900px] rounded-full bg-violet-500/10 dark:bg-violet-600/15 blur-[150px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[10%] left-[20%] w-[600px] h-[600px] rounded-full bg-cyan-500/5 dark:bg-cyan-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" />
        
        {/* Subtle noise grain */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      {/* Ultra-Premium Full-Width Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-white/10 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 dark:from-white dark:to-zinc-200 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500">
              <svg className="w-5 h-5 text-white dark:text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">TaskFlow</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 lg:gap-6">
            <a href="#features" className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">Features</a>
            <a href="#how-it-works" className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">How it Works</a>
            <a href="#pricing" className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all">Pricing</a>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <LanguageToggle />
            <div className="w-px h-5 bg-zinc-200 dark:bg-white/10 hidden sm:block"></div>
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors duration-300"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>
            <Link to="/login" className="hidden sm:block text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors">
              {t('nav.login')}
            </Link>
            <Link to="/register" className="text-sm font-semibold px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full hover:scale-105 hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_10px_20px_rgba(255,255,255,0.1)] transition-all duration-300 ml-2">
              {t('nav.register')}
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-16 relative z-10">
        
        {/* 1. Ultra-Premium Hero Section */}
        <section className="px-6 min-h-[95vh] flex flex-col items-center justify-center text-center pt-24 pb-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-5xl mx-auto relative z-20 flex flex-col items-center"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-sm font-semibold tracking-wide mb-10 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Introducing TaskFlow 2.0 - The ultimate workspace
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-6xl md:text-[5.5rem] font-black tracking-tighter text-zinc-900 dark:text-white leading-[1.1] mb-8">
              Work moves faster <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400">when it's beautiful.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              TaskFlow brings your team's work, goals, and communication together in one unified, elegant workspace. Stop managing tools and start achieving goals.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full">
              <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-lg rounded-full hover:scale-105 transition-all duration-300 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 group">
                Start for free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
              <a href="#features" className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 font-bold text-lg rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-300 shadow-sm flex items-center justify-center gap-2">
                Explore features
              </a>
            </motion.div>
            
            <motion.div variants={fadeIn} className="mt-10 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No credit card required • Free forever plan available
            </motion.div>
          </motion.div>

          {/* Fixed Parallax Hero Image */}
          <motion.div 
            style={{ y: heroY }}
            initial={{ opacity: 0, y: 100, rotateX: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-6xl mx-auto mt-24 relative perspective-[2000px] z-10"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-gradient-to-r from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/40 dark:to-purple-500/40 blur-[100px] rounded-full -z-10"></div>
            
            <div className="relative rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-zinc-200/80 dark:border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.6)] transform-gpu hover:scale-[1.02] transition-transform duration-700 bg-white dark:bg-black">
              <div className="h-10 md:h-12 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-white/5 flex items-center px-5 gap-2.5">
                <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-red-500/90 shadow-inner"></div>
                <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-amber-500/90 shadow-inner"></div>
                <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-green-500/90 shadow-inner"></div>
                <div className="ml-auto w-1/3 h-5 rounded-md bg-white/50 dark:bg-black/50 border border-zinc-200/50 dark:border-white/5 hidden md:block"></div>
              </div>
              <img src="/images/hero_dashboard.png" alt="TaskFlow Dashboard Mockup" className="w-full h-auto object-cover block aspect-video opacity-100" />
            </div>
          </motion.div>
        </section>

        {/* 2. Expanded Social Proof / Trusted By */}
        <section className="py-16 bg-zinc-50 dark:bg-black/50 border-y border-zinc-200/80 dark:border-white/5 overflow-hidden relative z-20">
          <div className="max-w-7xl mx-auto px-6 mb-10 text-center flex flex-col items-center">
             <p className="text-sm font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2">Trusted by over 10,000 forward-thinking teams</p>
             <div className="flex gap-1 mb-2 text-amber-400">
               {[1,2,3,4,5].map(star => (
                 <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
               ))}
             </div>
             <p className="text-zinc-600 dark:text-zinc-400 font-medium">4.9/5 average rating from 2,000+ reviews on G2 & Capterra</p>
          </div>
          <div className="flex gap-20 whitespace-nowrap px-6 opacity-60 dark:opacity-40 hover:opacity-100 transition-opacity duration-500 grayscale">
            <div className="animate-[marquee_25s_linear_infinite] flex gap-24 items-center">
               <span className="text-4xl font-black text-zinc-800 dark:text-white">ACME</span>
               <span className="text-4xl font-black text-zinc-800 dark:text-white">Globex</span>
               <span className="text-4xl font-black text-zinc-800 dark:text-white">Soylent</span>
               <span className="text-4xl font-black text-zinc-800 dark:text-white">Initech</span>
               <span className="text-4xl font-black text-zinc-800 dark:text-white">Stark</span>
               <span className="text-4xl font-black text-zinc-800 dark:text-white">Umbrella</span>
            </div>
            {/* Duplicate */}
            <div className="animate-[marquee_25s_linear_infinite] flex gap-24 items-center" aria-hidden="true">
               <span className="text-4xl font-black text-zinc-800 dark:text-white">ACME</span>
               <span className="text-4xl font-black text-zinc-800 dark:text-white">Globex</span>
               <span className="text-4xl font-black text-zinc-800 dark:text-white">Soylent</span>
               <span className="text-4xl font-black text-zinc-800 dark:text-white">Initech</span>
               <span className="text-4xl font-black text-zinc-800 dark:text-white">Stark</span>
               <span className="text-4xl font-black text-zinc-800 dark:text-white">Umbrella</span>
            </div>
          </div>
        </section>

        {/* 3. Bento Grid - Ultra Premium with Full Images */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto relative z-20">
          <div className="max-w-3xl mb-24 text-center md:text-left">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-5xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight mb-8"
            >
              Everything you need.<br/> Nothing you don't.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
              className="text-2xl text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed"
            >
              Designed for extreme focus. We stripped away the noise and clutter so your team can do their best work without distractions.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Card 1: Data Analytics (Uses generated image) */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="md:col-span-7 bg-white dark:bg-zinc-900/50 rounded-[2.5rem] overflow-hidden border border-zinc-200 dark:border-white/5 flex flex-col group shadow-xl dark:shadow-none"
            >
              <div className="h-[350px] w-full overflow-hidden relative bg-zinc-100 dark:bg-black">
                <img src="/images/bento_analytics.png" alt="Analytics" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-100 mix-blend-normal" />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-900/90 to-transparent opacity-80"></div>
              </div>
              <div className="p-10 pt-4 relative z-10 flex-1">
                <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">Beautiful Insights</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">Visualize your team's productivity with hyper-realistic charts and powerful analytics that look as good as they function.</p>
              </div>
            </motion.div>

            {/* Card 2: Kanban Flow (Now uses Unsplash Image) */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
              className="md:col-span-5 bg-white dark:bg-zinc-900/50 rounded-[2.5rem] overflow-hidden border border-zinc-200 dark:border-white/5 flex flex-col group shadow-xl dark:shadow-none"
            >
              <div className="h-[350px] w-full overflow-hidden relative bg-zinc-100 dark:bg-black">
                <img src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Kanban Flow" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-90 mix-blend-normal" />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-900/90 to-transparent opacity-80"></div>
              </div>
              <div className="p-10 pt-4 relative z-10 flex-1">
                <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">Flow State</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">Drag and drop Kanban boards that feel completely natural, fluid, and incredibly fast.</p>
              </div>
            </motion.div>

            {/* Card 3: Realtime Collaboration (Now uses Unsplash Image) */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2 }}
              className="md:col-span-12 bg-white dark:bg-zinc-900/50 rounded-[2.5rem] overflow-hidden border border-zinc-200 dark:border-white/5 flex flex-col md:flex-row group shadow-xl dark:shadow-none relative"
            >
              <div className="md:w-1/2 p-12 lg:p-16 flex flex-col justify-center relative z-10 bg-white dark:bg-transparent">
                <h3 className="text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-6">Real-time Collaboration</h3>
                <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed mb-10">See your team's cursors fly across the screen. Updates happen instantly, everywhere. No refreshing, no waiting, just pure productivity.</p>
                
                <div className="flex gap-4 flex-wrap">
                   <div className="px-5 py-2.5 rounded-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-white/10 flex items-center gap-3 font-medium text-zinc-700 dark:text-zinc-300 shadow-sm">
                     <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Live Cursors
                   </div>
                   <div className="px-5 py-2.5 rounded-full bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-white/10 flex items-center gap-3 font-medium text-zinc-700 dark:text-zinc-300 shadow-sm">
                     <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Instant Sync
                   </div>
                </div>
              </div>
              <div className="md:w-1/2 h-[400px] md:h-auto overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-zinc-900/90 to-transparent opacity-80 z-10 hidden md:block w-32 left-0"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-900/90 to-transparent opacity-80 z-10 md:hidden h-32 bottom-0 top-auto"></div>
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Collaboration" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 opacity-90" />
              </div>
            </motion.div>

          </div>
        </section>

        {/* 3.5 How It Works Section */}
        <section id="how-it-works" className="py-24 px-6 relative z-20 bg-zinc-50 dark:bg-black/30 border-y border-zinc-200/80 dark:border-white/5">
           <div className="max-w-7xl mx-auto">
             <div className="text-center mb-20">
               <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-6">Built for momentum</h2>
               <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">From idea to execution in three simple steps. TaskFlow is designed to get out of your way.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
                <div className="hidden md:block absolute top-14 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-zinc-200 via-indigo-500/50 to-zinc-200 dark:from-white/5 dark:via-indigo-500/50 dark:to-white/5"></div>
                {[
                  { title: "Create Workspace", desc: "Set up your personal or team environment in seconds. Invite colleagues and set permissions instantly.", icon: "01" },
                  { title: "Organize the Chaos", desc: "Break massive projects down into manageable tasks. Assign owners, due dates, and priority levels.", icon: "02" },
                  { title: "Achieve the Impossible", desc: "Watch the progress bar fill up. Celebrate wins with your team and review analytics to improve.", icon: "03" }
                ].map((step, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.2 }} className="relative flex flex-col items-center text-center group">
                    <div className="w-28 h-28 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-xl flex items-center justify-center text-4xl font-black text-zinc-900 dark:text-white mb-8 relative z-10 group-hover:scale-110 group-hover:border-indigo-500/50 transition-all duration-300">
                      {step.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">{step.title}</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-lg">{step.desc}</p>
                  </motion.div>
                ))}
             </div>
           </div>
        </section>

        {/* 4. Pricing Plans */}
        <section id="pricing" className="py-32 px-6 relative z-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-5xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight mb-6">Start for free.</h2>
              <p className="text-2xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">Transparent pricing that scales with your team's ambition. No hidden fees.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto items-stretch">
               
               <div className="bg-white dark:bg-zinc-900/50 p-12 rounded-[3rem] border border-zinc-200 dark:border-white/5 shadow-xl dark:shadow-none flex flex-col transition-transform hover:-translate-y-2 duration-500">
                 <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">Starter</h3>
                 <div className="flex items-baseline gap-2 mb-8">
                   <span className="text-7xl font-black text-zinc-900 dark:text-white">$0</span>
                   <span className="text-zinc-500 text-lg font-medium">/ forever</span>
                 </div>
                 <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-10 border-b border-zinc-200 dark:border-white/10 pb-10">Everything you need to organize your personal life or a tiny team.</p>
                 <ul className="flex flex-col gap-6 mb-12 flex-1">
                   {["Unlimited tasks & subtasks", "Up to 3 active projects", "Basic list and board views", "7-day activity history", "Community support"].map((item, i) => (
                     <li key={i} className="flex items-center gap-4 text-zinc-700 dark:text-zinc-300 font-medium text-lg">
                       <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                         <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                       </div>
                       {item}
                     </li>
                   ))}
                 </ul>
                 <Link to="/register" className="block w-full py-5 text-lg text-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                   Get Started
                 </Link>
               </div>

               <div className="bg-zinc-900 dark:bg-black p-12 rounded-[3rem] border border-zinc-800 dark:border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative overflow-hidden transform md:scale-105 z-10 flex flex-col">
                 <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 dark:bg-indigo-500/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                 <div className="inline-block self-start px-5 py-2 bg-indigo-500/10 text-indigo-400 text-sm font-bold uppercase tracking-wider rounded-full border border-indigo-500/20 mb-8">
                   Pro • Recommended
                 </div>
                 <div className="flex items-baseline gap-2 mb-8">
                   <span className="text-7xl font-black text-white">$12</span>
                   <span className="text-zinc-400 text-lg font-medium">/ user / month</span>
                 </div>
                 <p className="text-zinc-300 text-lg mb-10 border-b border-zinc-800 dark:border-white/10 pb-10">For professionals and teams who need supercharged productivity and analytics.</p>
                 <ul className="flex flex-col gap-6 mb-12 flex-1 relative z-10">
                   {["Everything in Starter, plus:", "Unlimited projects & workspaces", "Advanced AI productivity features", "Unlimited collaboration & guests", "Custom workflows & automation", "Priority 24/7 dedicated support"].map((item, i) => (
                     <li key={i} className="flex items-center gap-4 text-zinc-200 font-medium text-lg">
                       <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                         <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                       </div>
                       {item}
                     </li>
                   ))}
                 </ul>
                 <Link to="/register" className="block w-full py-5 text-lg text-center rounded-2xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.15)] relative z-10">
                   Upgrade to Pro
                 </Link>
               </div>
            </div>
          </div>
        </section>

        {/* 5. Integrations Logo Cloud */}
        <section className="py-24 px-6 border-y border-zinc-200/80 dark:border-white/5 bg-zinc-50 dark:bg-black/30 relative z-20">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-10">Plays well with your favorite tools</h2>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 dark:opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
               <div className="flex items-center gap-3 font-bold text-2xl text-zinc-800 dark:text-white"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.09.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg> GitHub</div>
               <div className="flex items-center gap-3 font-bold text-2xl text-zinc-800 dark:text-white"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM5.042 8.835a2.528 2.528 0 01-2.52-2.521A2.528 2.528 0 015.042 3.79 2.528 2.528 0 017.562 6.314v2.521h-2.52zM6.313 7.573a2.527 2.527 0 012.521-2.52 2.528 2.528 0 012.521 2.52v2.522H6.313V7.573zM15.165 8.835a2.528 2.528 0 012.523-2.521A2.528 2.528 0 0120.21 8.835a2.527 2.527 0 01-2.522 2.521h-2.523v-2.52zM13.893 8.835a2.527 2.527 0 01-2.522 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.528 2.528 0 0111.371 0a2.528 2.528 0 012.522 2.522v6.313zM15.165 15.165a2.528 2.528 0 012.523 2.523A2.528 2.528 0 0115.165 20.21a2.528 2.528 0 01-2.523-2.522v-2.523h2.523zM13.893 16.427a2.527 2.527 0 01-2.522 2.52 2.528 2.528 0 01-2.52-2.52v-2.522h5.042v2.522z"/></svg> Slack</div>
               <div className="flex items-center gap-3 font-bold text-2xl text-zinc-800 dark:text-white"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.09.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg> Notion</div>
               <div className="flex items-center gap-3 font-bold text-2xl text-zinc-800 dark:text-white"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z"/></svg> Figma</div>
            </div>
          </div>
        </section>

        {/* 6. Massive CTA - Now with Course Image */}
        <section className="py-32 px-6 relative z-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-8 border border-indigo-100 dark:border-indigo-500/20">
                🚀 Master your productivity
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 dark:text-white mb-8 leading-tight">
                Ready to dive in?
              </h2>
              <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Join our free crash course on workflow mastery when you sign up today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white bg-zinc-900 dark:bg-white dark:text-black rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(255,255,255,0.2)]">
                  Start for Free
                </Link>
                <button className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-300">
                  Watch Trailer
                </button>
              </div>
            </div>

            <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.5)] transform-gpu hover:scale-[1.02] transition-transform duration-500 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 group">
              <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Productivity Course" className="w-full h-full object-cover block aspect-[4/3] opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 p-10 w-full">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-6 border border-white/30 cursor-pointer hover:bg-white hover:text-black transition-colors duration-300 shadow-lg">
                  <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Workflow Mastery Course</h3>
                <p className="text-white/80 font-medium">Included for all new members</p>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* 7. Comprehensive Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2 md:col-span-2 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
                  <svg className="w-5 h-5 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">TaskFlow</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-xs leading-relaxed">
                The most elegant way to manage projects, tasks, and teams. Built for high-performing professionals.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Product</h4>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-sm">Features</a>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-sm">Integrations</a>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-sm">Pricing</a>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-sm">Changelog</a>
            </div>
            
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Company</h4>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-sm">About Us</a>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-sm">Careers</a>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-sm">Blog</a>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-sm">Contact</a>
            </div>
            
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Legal</h4>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-sm">Terms of Service</a>
              <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-sm">Security</a>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-500">
              &copy; {new Date().getFullYear()} TaskFlow Inc. All rights reserved.
            </div>
            <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
               <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
               <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
            </div>
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
