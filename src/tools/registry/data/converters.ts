import type { ToolDefinition } from '../types';
import { generalConverters } from './converters/groups/generalConverters';
import { structuredConverters } from './converters/groups/structuredConverters';
import { utilityConverters } from './converters/groups/utilityConverters';

export const converters: ToolDefinition[] = [
    ...generalConverters,
    ...structuredConverters,
    ...utilityConverters,
];
