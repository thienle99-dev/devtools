import { Network, RotateCw, Fingerprint, Search } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';

export const networkTools: ToolDefinition[] = [
    {
        id: 'ipv4-subnet',
        name: 'IPv4 Subnet',
        path: '/ipv4-subnet',
        description: 'CIDR calculator and ranges',
        category: 'network',
        icon: Network,
        color: 'text-cyan-500',
        component: Lazy.Ipv4SubnetCalculator,
        keywords: ['ip', 'subnet', 'cidr', 'network', 'mask']
    },
    {
        id: 'ipv4-converter',
        name: 'IPv4 Converter',
        path: '/ipv4-converter',
        description: 'Decimal, Binary, Hex converter',
        category: 'network',
        icon: RotateCw,
        color: 'text-blue-500',
        component: Lazy.Ipv4Converter,
        keywords: ['ip', 'convert', 'decimal', 'binary', 'hex']
    },
    {
        id: 'mac-generator',
        name: 'MAC Generator',
        path: '/mac-generator',
        description: 'Generate Random MAC Addresses',
        category: 'network',
        icon: Fingerprint,
        color: 'text-purple-400',
        component: Lazy.MacGenerator,
        keywords: ['mac', 'generator', 'address', 'network']
    },
    {
        id: 'mac-lookup',
        name: 'MAC Lookup',
        path: '/mac-lookup',
        description: 'Find vendor by MAC Address',
        category: 'network',
        icon: Search,
        color: 'text-orange-400',
        component: Lazy.MacLookup,
        keywords: ['mac', 'lookup', 'vendor', 'oui']
    },
];
