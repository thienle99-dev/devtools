// Phase 2: Lazy load Tesseract.js (30MB saved on initial load)
import { loadTesseract } from '@utils/lazyLoad';

export interface DetectedText {
    text: string;
    bbox: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
    };
    confidence: number;
}

export interface SensitivePattern {
    type: 'email' | 'ip' | 'apiKey' | 'phone' | 'ssn' | 'creditCard';
    pattern: RegExp;
    label: string;
}

// Regex patterns for sensitive information
export const SENSITIVE_PATTERNS: SensitivePattern[] = [
    {
        type: 'email',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        label: 'Email Address'
    },
    {
        type: 'ip',
        pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
        label: 'IP Address'
    },
    {
        type: 'apiKey',
        pattern: /\b[A-Za-z0-9]{32,}\b/g,
        label: 'API Key'
    },
    {
        type: 'phone',
        pattern: /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g,
        label: 'Phone Number'
    },
    {
        type: 'ssn',
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        label: 'SSN'
    },
    {
        type: 'creditCard',
        pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        label: 'Credit Card'
    }
];

/**
 * Perform OCR on an image to extract text
 * Phase 2: Lazy loads Tesseract.js only when needed
 */
export async function performOCR(imageDataUrl: string): Promise<DetectedText[]> {
    try {
        // Lazy load Tesseract.js
        const Tesseract = await loadTesseract();

        const result = await Tesseract.recognize(imageDataUrl, 'eng', {
            logger: (m: any) => {
                if (m.status === 'recognizing text') {
                    console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            }
        });

        const detectedTexts: DetectedText[] = [];

        // Extract words with their bounding boxes
        const words = (result.data as any).words || [];
        for (const word of words) {
            detectedTexts.push({
                text: word.text,
                bbox: word.bbox,
                confidence: word.confidence
            });
        }

        return detectedTexts;
    } catch (error) {
        console.error('OCR failed:', error);
        return [];
    }
}

/**
 * Detect sensitive information using regex patterns
 */
export function detectSensitivePatterns(text: string): Array<{
    type: string;
    match: string;
    label: string;
}> {
    const detected: Array<{ type: string; match: string; label: string }> = [];

    for (const pattern of SENSITIVE_PATTERNS) {
        const matches = text.matchAll(pattern.pattern);
        for (const match of matches) {
            detected.push({
                type: pattern.type,
                match: match[0],
                label: pattern.label
            });
        }
    }

    return detected;
}

/**
 * Find text positions in OCR results that match sensitive patterns
 */
export function findSensitiveTextPositions(
    detectedTexts: DetectedText[],
    sensitiveMatches: Array<{ type: string; match: string; label: string }>
): Array<DetectedText & { type: string; label: string }> {
    const sensitivePositions: Array<DetectedText & { type: string; label: string }> = [];

    for (const detected of detectedTexts) {
        for (const sensitive of sensitiveMatches) {
            // Check if the detected text contains the sensitive match
            if (detected.text.toLowerCase().includes(sensitive.match.toLowerCase())) {
                sensitivePositions.push({
                    ...detected,
                    type: sensitive.type,
                    label: sensitive.label
                });
            }
        }
    }

    return sensitivePositions;
}

/**
 * Analyze image for sensitive information
 */
export async function analyzeSensitiveInfo(imageDataUrl: string): Promise<{
    detectedTexts: DetectedText[];
    sensitiveMatches: Array<{ type: string; match: string; label: string }>;
    sensitivePositions: Array<DetectedText & { type: string; label: string }>;
}> {
    // Perform OCR
    const detectedTexts = await performOCR(imageDataUrl);

    // Combine all detected text
    const fullText = detectedTexts.map(t => t.text).join(' ');

    // Detect sensitive patterns
    const sensitiveMatches = detectSensitivePatterns(fullText);

    // Find positions of sensitive text
    const sensitivePositions = findSensitiveTextPositions(detectedTexts, sensitiveMatches);

    return {
        detectedTexts,
        sensitiveMatches,
        sensitivePositions
    };
}
