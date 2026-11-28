import React, { useState } from 'react';

const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-950 text-slate-100 text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-white/10 text-[10px] font-mono text-slate-400">
        <span>{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-slate-300 hover:text-white font-semibold transition-colors cursor-pointer"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};

/**
 * Render inline markdown (**bold**, *italic*, `code`) cleanly without dangerouslySetInnerHTML.
 */
function renderInline(text) {
  const parts = [];
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-[12px]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

const MarkdownMessage = ({ content }) => {
  if (!content) return null;

  // Split out fenced code blocks first
  const segments = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIdx = 0;
  let m;

  while ((m = codeBlockRegex.exec(content)) !== null) {
    if (m.index > lastIdx) {
      segments.push({ type: 'text', value: content.slice(lastIdx, m.index) });
    }
    segments.push({ type: 'code', lang: m[1], value: m[2].trimEnd() });
    lastIdx = codeBlockRegex.lastIndex;
  }
  if (lastIdx < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIdx) });
  }

  return (
    <div className="space-y-2 text-[13.5px] sm:text-sm leading-relaxed break-words">
      {segments.map((seg, segIdx) => {
        if (seg.type === 'code') {
          return <CodeBlock key={segIdx} language={seg.lang} code={seg.value} />;
        }

        const lines = seg.value.split('\n');
        return (
          <div key={segIdx} className="space-y-1.5">
            {lines.map((rawLine, lineIdx) => {
              const line = rawLine.trim();
              if (!line) return <div key={lineIdx} className="h-1" />;

              // Headings
              if (line.startsWith('### ')) {
                return (
                  <h4 key={lineIdx} className="font-extrabold text-slate-900 dark:text-white text-sm pt-1">
                    {renderInline(line.slice(4))}
                  </h4>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h3 key={lineIdx} className="font-extrabold text-slate-900 dark:text-white text-[15px] pt-1.5">
                    {renderInline(line.slice(3))}
                  </h3>
                );
              }
              if (line.startsWith('# ')) {
                return (
                  <h3 key={lineIdx} className="font-black text-slate-900 dark:text-white text-base pt-1.5">
                    {renderInline(line.slice(2))}
                  </h3>
                );
              }

              // Bullet list item
              if (/^[-*•]\s+/.test(line)) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-1">
                    <span className="text-indigo-500 dark:text-cyan-400 font-bold mt-0.5 shrink-0">•</span>
                    <span className="flex-1">{renderInline(line.replace(/^[-*•]\s+/, ''))}</span>
                  </div>
                );
              }

              // Numbered list item
              const numMatch = line.match(/^(\d+\.)\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-1">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0 tabular-nums">
                      {numMatch[1]}
                    </span>
                    <span className="flex-1">{renderInline(numMatch[2])}</span>
                  </div>
                );
              }

              return <p key={lineIdx}>{renderInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

export default MarkdownMessage;
