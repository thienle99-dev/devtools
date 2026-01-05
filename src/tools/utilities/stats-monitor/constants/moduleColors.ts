export const MODULE_COLORS = {
  cpu: { 
    bg: 'bg-emerald-500/15', 
    text: 'text-emerald-600 dark:text-emerald-400', 
    border: 'border-emerald-500/30', 
    dot: 'bg-emerald-500' 
  },
  memory: { 
    bg: 'bg-blue-500/15', 
    text: 'text-blue-600 dark:text-blue-400', 
    border: 'border-blue-500/30', 
    dot: 'bg-blue-500' 
  },
  network: { 
    bg: 'bg-purple-500/15', 
    text: 'text-purple-600 dark:text-purple-400', 
    border: 'border-purple-500/30', 
    dot: 'bg-purple-500' 
  },
  disk: { 
    bg: 'bg-violet-500/15', 
    text: 'text-violet-600 dark:text-violet-400', 
    border: 'border-violet-500/30', 
    dot: 'bg-violet-500' 
  },
  gpu: { 
    bg: 'bg-pink-500/15', 
    text: 'text-pink-600 dark:text-pink-400', 
    border: 'border-pink-500/30', 
    dot: 'bg-pink-500' 
  },
  battery: { 
    bg: 'bg-green-500/15', 
    text: 'text-green-600 dark:text-green-400', 
    border: 'border-green-500/30', 
    dot: 'bg-green-500' 
  },
  sensors: { 
    bg: 'bg-orange-500/15', 
    text: 'text-orange-600 dark:text-orange-400', 
    border: 'border-orange-500/30', 
    dot: 'bg-orange-500' 
  },
} as const;

export const getModuleColors = (moduleId: string) => {
  return MODULE_COLORS[moduleId as keyof typeof MODULE_COLORS] || {
    bg: 'bg-gray-500/15',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/30',
    dot: 'bg-gray-500'
  };
};

