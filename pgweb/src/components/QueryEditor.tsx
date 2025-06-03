'use client';

import { useState, useRef, useEffect } from 'react';

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  isLoading: boolean;
}

export default function QueryEditor({ value, onChange, onExecute, isLoading }: QueryEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Move cursor position after the inserted tab
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    } else if (e.key === 'Enter' && e.ctrlKey) {
      onExecute();
    }
  };

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">SQL Query</h2>
        <button
          onClick={onExecute}
          disabled={isLoading}
          className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Running...' : 'Run Query (Ctrl+Enter)'}
        </button>
      </div>
      
      <div className="flex-grow relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full min-h-[100px] p-2 font-mono text-sm border rounded resize-none bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter SQL query here..."
          spellCheck="false"
        />
      </div>
    </div>
  );
}