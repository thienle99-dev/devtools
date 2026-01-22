import { Network, HardDrive, Ruler, Clock, Globe, Percent, DollarSign } from 'lucide-react';
import * as Lazy from '@tools/registry/lazy-tools';
import type { ToolDefinition } from '@tools/registry/types';
import { TOOL_IDS } from '../../../tool-ids';

export const utilityConverters: ToolDefinition[] = [
    {
        id: TOOL_IDS.IP_ADDRESS,
        name: 'IP Address Converter',
        path: '/ip-address',
        description: 'Convert between IPv4 address formats',
        category: 'converters',
        icon: Network,
        color: 'text-blue-400',
        component: Lazy.IpAddressConverter,
        keywords: ['ip', 'address', 'ipv4', 'dotted', 'decimal', 'binary', 'convert']
    },
    {
        id: TOOL_IDS.MAC_ADDRESS,
        name: 'MAC Address Converter',
        path: '/mac-address',
        description: 'Convert between different MAC address formats',
        category: 'converters',
        icon: Network,
        color: 'text-indigo-400',
        component: Lazy.MacAddressConverter,
        keywords: ['mac', 'address', 'format', 'colon', 'hyphen', 'convert']
    },
    {
        id: TOOL_IDS.FILE_SIZE,
        name: 'File Size Converter',
        path: '/file-size',
        description: 'Convert between bytes, KB, MB, GB, TB, PB',
        category: 'converters',
        icon: HardDrive,
        color: 'text-amber-400',
        component: Lazy.FileSizeConverter,
        keywords: ['file', 'size', 'bytes', 'kb', 'mb', 'gb', 'tb', 'pb', 'convert']
    },
    {
        id: TOOL_IDS.UNIT_CONVERTER,
        name: 'Unit Converter',
        path: '/unit-converter',
        description: 'Convert between length, weight, volume, and speed units',
        category: 'converters',
        icon: Ruler,
        color: 'text-teal-400',
        component: Lazy.UnitConverter,
        keywords: ['unit', 'length', 'weight', 'volume', 'speed', 'meter', 'kilogram', 'liter', 'convert']
    },
    {
        id: TOOL_IDS.EPOCH_TIMESTAMP,
        name: 'Epoch Timestamp Converter',
        path: '/epoch-timestamp',
        description: 'Convert between Unix timestamps and dates',
        category: 'converters',
        icon: Clock,
        color: 'text-orange-400',
        component: Lazy.EpochTimestampConverter,
        keywords: ['epoch', 'timestamp', 'unix', 'date', 'time', 'convert']
    },
    {
        id: TOOL_IDS.TIMEZONE_CONVERTER,
        name: 'Time Zone Converter',
        path: '/timezone-converter',
        description: 'Convert dates between different time zones',
        category: 'converters',
        icon: Globe,
        color: 'text-cyan-400',
        component: Lazy.TimeZoneConverter,
        keywords: ['timezone', 'time', 'zone', 'utc', 'convert', 'date']
    },
    {
        id: TOOL_IDS.PERCENTAGE_FRACTION,
        name: 'Percentage/Fraction/Decimal Converter',
        path: '/percentage-fraction',
        description: 'Convert between percentage, fraction, and decimal formats',
        category: 'converters',
        icon: Percent,
        color: 'text-pink-400',
        component: Lazy.PercentageFractionConverter,
        keywords: ['percentage', 'fraction', 'decimal', 'convert', 'percent']
    },
    {
        id: TOOL_IDS.CURRENCY_CONVERTER,
        name: 'Currency Converter',
        path: '/currency-converter',
        description: 'Convert between different currencies',
        category: 'converters',
        icon: DollarSign,
        color: 'text-green-400',
        component: Lazy.CurrencyConverter,
        keywords: ['currency', 'money', 'exchange', 'rate', 'usd', 'eur', 'gbp', 'convert']
    },
];
