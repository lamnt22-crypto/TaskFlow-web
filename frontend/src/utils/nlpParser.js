/**
 * NLP Smart Parser
 * Parses natural language in Vietnamese and English to extract task priority and due dates.
 */

const PRIORITIES = {
  URGENT: ['khẩn cấp', 'gấp', 'urgent', 'asap', 'ngay lập tức'],
  HIGH: ['ưu tiên cao', 'quan trọng', 'high priority', 'high', 'cao'],
  LOW: ['ưu tiên thấp', 'không gấp', 'low priority', 'low', 'thấp'],
  MEDIUM: ['ưu tiên bình thường', 'medium priority', 'medium', 'bình thường'] // usually default, less explicitly typed
};

// Date regex patterns
const datePatterns = [
  { regex: /(hôm nay|today)/i, daysOffset: 0 },
  { regex: /(ngày mai|mai|tomorrow)/i, daysOffset: 1 },
  { regex: /(ngày mốt|mốt|day after tomorrow)/i, daysOffset: 2 },
  { regex: /(tuần sau|next week)/i, daysOffset: 7 },
  // specific day of week (1-6 for Mon-Sat, 0 for Sun in JS)
  { regex: /(thứ hai|thứ 2|monday|mon)/i, targetDow: 1 },
  { regex: /(thứ ba|thứ 3|tuesday|tue)/i, targetDow: 2 },
  { regex: /(thứ tư|thứ 4|wednesday|wed)/i, targetDow: 3 },
  { regex: /(thứ năm|thứ 5|thursday|thu)/i, targetDow: 4 },
  { regex: /(thứ sáu|thứ 6|friday|fri)/i, targetDow: 5 },
  { regex: /(thứ bảy|thứ 7|saturday|sat)/i, targetDow: 6 },
  { regex: /(chủ nhật|sunday|sun)/i, targetDow: 0 },
];

// Time regex patterns (e.g. 5h chiều, 17:00, 5 giờ)
const timeRegex = /(\d{1,2})(:(\d{2}))?\s*(h|giờ)?\s*(sáng|chiều|tối|am|pm)?/i;

export const parseSmartInput = (text) => {
  if (!text || typeof text !== 'string') return { title: '', priority: null, dueDate: null };

  let cleanText = text;
  let priority = null;
  let dueDate = null;
  let hasExtractedDate = false;

  // 1. Extract Priority
  for (const [key, keywords] of Object.entries(PRIORITIES)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(cleanText)) {
        priority = key;
        cleanText = cleanText.replace(regex, '').trim();
        break; // Only match highest priority keyword
      }
    }
    if (priority) break;
  }

  // 2. Extract Date
  let baseDate = new Date();
  
  for (const pattern of datePatterns) {
    if (pattern.regex.test(cleanText)) {
      hasExtractedDate = true;
      if (pattern.daysOffset !== undefined) {
        baseDate.setDate(baseDate.getDate() + pattern.daysOffset);
      } else if (pattern.targetDow !== undefined) {
        const currentDow = baseDate.getDay();
        let daysToAdd = pattern.targetDow - currentDow;
        if (daysToAdd <= 0) daysToAdd += 7; // Next week's occurrence
        baseDate.setDate(baseDate.getDate() + daysToAdd);
      }
      cleanText = cleanText.replace(pattern.regex, '').trim();
      break;
    }
  }

  // 3. Extract Time
  const timeMatch = cleanText.match(timeRegex);
  if (timeMatch) {
    hasExtractedDate = true;
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    const ampm = timeMatch[5] ? timeMatch[5].toLowerCase() : null;

    if ((ampm === 'chiều' || ampm === 'tối' || ampm === 'pm') && hour < 12) {
      hour += 12;
    } else if ((ampm === 'sáng' || ampm === 'am') && hour === 12) {
      hour = 0;
    }

    baseDate.setHours(hour, minute, 0, 0);
    cleanText = cleanText.replace(timeRegex, '').trim();
  } else {
    // Default time if date mentioned but no time: end of day
    baseDate.setHours(23, 59, 59, 999);
  }

  if (hasExtractedDate) {
    dueDate = baseDate;
  }

  // Final cleanup: remove redundant words like "vào", "lúc", "nhé", "cho" if they are stranded at the end
  cleanText = cleanText.replace(/\s+(vào|lúc|nhé|nha)$/i, '').trim();
  // Cleanup extra spaces
  cleanText = cleanText.replace(/\s{2,}/g, ' ');

  return {
    title: cleanText,
    priority: priority || 'MEDIUM',
    dueDate: dueDate
  };
};
