import type { ToolDefinition } from './types';
import { formatters } from './data/formatters';
import { converters } from './data/converters';
import { cryptoTools } from './data/crypto';
import { webTools } from './data/web';
import { developmentTools } from './data/development';
import { mediaTools } from './data/media';
import { imageTools } from './data/image';
import { textTools } from './data/text';
import { mathTools } from './data/math';
import { pluginTools } from './data/plugins';
import { pdfTools } from './data/pdf';
import { dataTools } from './data/data';

export const TOOLS: ToolDefinition[] = [
    ...formatters,
    ...converters,
    ...cryptoTools,
    ...webTools,
    ...developmentTools,
    ...mediaTools,
    ...imageTools,
    ...textTools,
    ...mathTools,
    ...pluginTools,
    ...pdfTools,
    ...dataTools,
];
