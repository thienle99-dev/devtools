// Xnapper-style background presets
export const XNAPPER_BG_PRESETS = [
    {
        id: 'desktop',
        name: 'Desktop',
        gradient: {
            type: 'linear' as const,
            angle: 135,
            colors: ['#FF6B35', '#F7931E', '#FDC830']
        }
    },
    {
        id: 'cool',
        name: 'Cool',
        gradient: {
            type: 'linear' as const,
            angle: 135,
            colors: ['#4FACFE', '#00F2FE']
        }
    },
    {
        id: 'nice',
        name: 'Nice',
        gradient: {
            type: 'linear' as const,
            angle: 135,
            colors: ['#FA709A', '#FEE140']
        }
    },
    {
        id: 'morning',
        name: 'Morning',
        gradient: {
            type: 'linear' as const,
            angle: 135,
            colors: ['#FFB75E', '#ED8F03']
        }
    },
    {
        id: 'bright',
        name: 'Bright',
        gradient: {
            type: 'linear' as const,
            angle: 135,
            colors: ['#A8EDEA', '#FED6E3']
        }
    },
    {
        id: 'love',
        name: 'Love',
        gradient: {
            type: 'linear' as const,
            angle: 135,
            colors: ['#D66D75', '#E29587']
        }
    },
    {
        id: 'rain',
        name: 'Rain',
        gradient: {
            type: 'linear' as const,
            angle: 135,
            colors: ['#667EEA', '#764BA2']
        }
    },
    {
        id: 'sky',
        name: 'Sky',
        gradient: {
            type: 'linear' as const,
            angle: 135,
            colors: ['#89F7FE', '#66A6FF']
        }
    },
    {
        id: 'none',
        name: 'None',
        gradient: null
    },
    {
        id: 'custom',
        name: 'Custom',
        gradient: null
    }
] as const;

export const ASPECT_RATIO_PRESETS = [
    { id: 'auto', label: 'Auto', ratio: null },
    { id: '4:3', label: '4:3', ratio: 4 / 3 },
    { id: '3:2', label: '3:2', ratio: 3 / 2 },
    { id: '16:9', label: '16:9', ratio: 16 / 9 },
    { id: '1:1', label: '1:1', ratio: 1 },
] as const;

export const SOCIAL_PRESETS = [
    { id: 'twitter', label: 'Twitter', width: 1200, height: 675 },
    { id: 'facebook', label: 'Facebook', width: 1200, height: 630 },
    { id: 'instagram', label: 'Instagram', width: 1080, height: 1080 },
    { id: 'linkedin', label: 'LinkedIn', width: 1200, height: 627 },
    { id: 'youtube', label: 'Youtube', width: 1280, height: 720 },
    { id: 'pinterest', label: 'Pinterest', width: 1000, height: 1500 },
    { id: 'reddit', label: 'Reddit', width: 1200, height: 628 },
    { id: 'snapchat', label: 'Snapchat', width: 1080, height: 1920 },
] as const;

export function generateGradientCSS(gradient: { type: string; angle?: number; colors: string[] }): string {
    if (gradient.type === 'linear') {
        const angle = gradient.angle || 135;
        return `linear-gradient(${angle}deg, ${gradient.colors.join(', ')})`;
    }
    return `radial-gradient(circle, ${gradient.colors.join(', ')})`;
}
