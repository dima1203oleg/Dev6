import React from 'react';
import { FileQuestion } from 'lucide-react';

interface EmptyTabStateProps {
  title: string;
  description?: string;
}

export const EmptyTabState: React.FC<EmptyTabStateProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] bg-slate-900 border border-slate-800 rounded-xl">
      <FileQuestion size={48} className="text-slate-600 mb-4" />
      <h3 className="text-lg font-medium text-slate-300 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-md">
        {description || "Дані для цього розділу наразі відсутні, недоступні в джерелах, або модуль знаходиться в стані розробки."}
      </p>
    </div>
  );
};
