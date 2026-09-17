import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { parseSmartInput } from '../utils/nlpParser';
import { PriorityBadge } from './Badge';
import { parseTaskFromText } from '../services/aiService';
import toast from 'react-hot-toast';

const SmartTaskInput = ({ onSubmit, isSubmitting }) => {
  const { t, i18n } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [parsedData, setParsedData] = useState({ title: '', priority: 'MEDIUM', dueDate: null });
  const [isListening, setIsListening] = useState(false);
  const [isAIParsing, setIsAIParsing] = useState(false);
  
  // Check Speech Support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSpeechSupported = !!SpeechRecognition;

  useEffect(() => {
    // Parse input on the fly
    const timer = setTimeout(() => {
      setParsedData(parseSmartInput(inputValue));
    }, 200); // slight debounce for performance
    
    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!parsedData.title || isSubmitting) return;

    onSubmit({
      title: parsedData.title,
      priority: parsedData.priority,
      due_date: parsedData.dueDate ? parsedData.dueDate.toISOString() : null,
      status: 'TODO'
    });
    
    setInputValue('');
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'URGENT': return 'Khẩn cấp';
      case 'HIGH': return 'Cao';
      case 'MEDIUM': return 'Bình thường';
      case 'LOW': return 'Thấp';
      default: return priority;
    }
  };

  const handleVoiceRecord = () => {
    if (!isSpeechSupported) {
      toast.error(isVietnamese ? 'Trình duyệt không hỗ trợ nhận diện giọng nói.' : 'Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === 'vi' ? 'vi-VN' : navigator.language; // Auto-detect or use user's lang
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setInputValue('');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const currentText = finalTranscript || interimTranscript;
      setInputValue(currentText);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      console.error('Speech recognition error', event.error);
      if (event.error !== 'aborted') {
        toast.error('Lỗi nhận diện giọng nói: ' + event.error);
      }
    };

    recognition.onend = async () => {
      setIsListening(false);
      
      // When done speaking, trigger AI Parse if input is not empty
      setInputValue(prev => {
        if (prev.trim()) {
           triggerAIParse(prev);
        }
        return prev;
      });
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const triggerAIParse = async (text) => {
    setIsAIParsing(true);
    try {
      const parsed = await parseTaskFromText(text);
      if (parsed && parsed.title) {
        setParsedData({
          title: parsed.title,
          priority: parsed.priority || 'MEDIUM',
          dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null
        });
        toast.success(isVietnamese ? 'AI đã phân tích xong!' : 'AI parsed successfully!');
      }
    } catch (err) {
      toast.error('AI Error: ' + err.message);
    } finally {
      setIsAIParsing(false);
    }
  };

  const isVietnamese = i18n.language === 'vi';

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-4xl mx-auto mb-6 group">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
      
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 flex flex-col transition-all focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:shadow-md">
        <div className="flex items-center w-full px-3 py-2">
          <div className="shrink-0 mr-3 text-indigo-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSubmitting || isAIParsing}
            placeholder={isListening ? (isVietnamese ? "Đang nghe..." : "Listening...") : (isVietnamese ? "Gõ: 'Nộp báo cáo 5h chiều nay ưu tiên cao'..." : "Type: 'Submit report 5pm tomorrow high priority'...")}
            className="flex-1 bg-transparent border-none text-slate-800 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-base"
            autoComplete="off"
          />
          
          {isSpeechSupported && (
            <button
              type="button"
              onClick={handleVoiceRecord}
              className={`ml-2 shrink-0 p-2 rounded-full transition-all flex items-center justify-center ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
              title={isVietnamese ? "Ghi âm bằng giọng nói" : "Voice to Task"}
            >
              <svg className="w-5 h-5" fill={isListening ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
          )}

          <button 
            type="submit"
            disabled={!parsedData.title || isSubmitting || isAIParsing}
            className="ml-3 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {(isSubmitting || isAIParsing) ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            )}
            Enter
          </button>
        </div>
        
        {/* Live Feedback Badges Container */}
        <AnimatePresence>
          {inputValue.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-2 pt-1 flex flex-wrap items-center gap-2 overflow-hidden"
            >
              {/* Due Date Badge */}
              <AnimatePresence>
                {parsedData.dueDate && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {parsedData.dueDate.toLocaleString(isVietnamese ? 'vi-VN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Priority Badge */}
              {parsedData.priority && parsedData.priority !== 'MEDIUM' && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                    parsedData.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' :
                    parsedData.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <PriorityBadge priority={parsedData.priority} />
                </motion.div>
              )}
              
              {/* Title Feedback */}
              {parsedData.title && (
                <div className="text-xs font-medium text-slate-400 dark:text-slate-500 ml-1">
                  Title: <span className="text-slate-700 dark:text-slate-300">"{parsedData.title}"</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
};

export default SmartTaskInput;
