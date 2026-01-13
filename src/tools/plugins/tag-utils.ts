
export const getTagColor = (tag: string): string => {
  const t = tag.toLowerCase();
  const base = "shadow-sm border"; // Common classes for consistent look

  // Specific mappings with full Tailwind classes to ensure they are generated
  if (['media', 'video', 'audio', 'music'].some(k => t.includes(k))) 
    return `bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400 ${base}`;
  
  if (['document', 'pdf', 'text', 'format'].some(k => t.includes(k))) 
    return `bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400 ${base}`;
  
  if (['developer', 'code', 'git', 'debug', 'json'].some(k => t.includes(k))) 
    return `bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400 ${base}`;
  
  if (['security', 'crypto', 'auth', 'hash'].some(k => t.includes(k))) 
    return `bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400 ${base}`;
  
  if (['network', 'web', 'http', 'api'].some(k => t.includes(k))) 
    return `bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 ${base}`;
  
  if (['ai', 'bot', 'smart', 'model', 'gen'].some(k => t.includes(k))) 
    return `bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/30 dark:text-fuchsia-400 ${base}`;
  
  if (['utility', 'system', 'clean', 'os'].some(k => t.includes(k))) 
    return `bg-slate-500/10 text-slate-600 border-slate-500/30 dark:text-slate-400 ${base}`;
  
  if (['download', 'upload', 'file'].some(k => t.includes(k))) 
    return `bg-cyan-500/10 text-cyan-600 border-cyan-500/30 dark:text-cyan-400 ${base}`;

  // Hash-based fallback for others with predefined full strings
  const fallbackStyles = [
    `bg-orange-500/10 text-orange-600 border-orange-500/30 dark:text-orange-400 ${base}`,
    `bg-lime-500/10 text-lime-600 border-lime-500/30 dark:text-lime-400 ${base}`,
    `bg-indigo-500/10 text-indigo-600 border-indigo-500/30 dark:text-indigo-400 ${base}`,
    `bg-pink-500/10 text-pink-600 border-pink-500/30 dark:text-pink-400 ${base}`,
    `bg-teal-500/10 text-teal-600 border-teal-500/30 dark:text-teal-400 ${base}`,
  ];

  let hash = 0;
  for (let i = 0; i < t.length; i++) hash = t.charCodeAt(i) + ((hash << 5) - hash);
  return fallbackStyles[Math.abs(hash) % fallbackStyles.length];
};
