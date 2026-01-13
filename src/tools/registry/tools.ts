import type { ToolDefinition } from './types';
import { formatters } from './data/formatters';
import { converters } from './data/converters';
import { pdfTools } from './data/pdf';
import { cryptoTools } from './data/crypto';
import { webTools } from './data/web';
import { networkTools } from './data/network';
import { developmentTools } from './data/development';
import { utilityTools } from './data/utilities';
import { mediaTools } from './data/media';
import { imageTools } from './data/image';
import { textTools } from './data/text';
import { mathTools } from './data/math';
import { securityTools } from './data/security';
import { pluginTools } from './data/plugins';

export const TOOLS: ToolDefinition[] = [
    ...formatters,
    ...converters,
    ...pdfTools,
    ...cryptoTools,
    ...webTools,
    ...networkTools,
    ...developmentTools,
    ...utilityTools,
    ...mediaTools,
    ...imageTools,
    ...textTools,
    ...mathTools,
    ...securityTools,
    ...pluginTools,
];
