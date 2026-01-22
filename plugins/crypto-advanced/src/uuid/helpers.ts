import { decodeTime } from 'ulid';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

export const extractV1Timestamp = (uuid: string): Date | undefined => {
    try {
        const parts = uuid.split('-');
        if (parts.length !== 5) return undefined;

        const timeLow = parts[0];
        const timeMid = parts[1];
        const timeHigh = parts[2].substring(1);
        const timestampHex = timeHigh + timeMid + timeLow;
        const timestamp = parseInt(timestampHex, 16);
        const epochDiff = 122192928000000000n;
        const unixTimestamp = (BigInt(timestamp) - epochDiff) / 10000n;
        return new Date(Number(unixTimestamp));
    } catch {
        return undefined;
    }
};

export const extractV6Timestamp = (uuid: string): Date | undefined => {
    try {
        const parts = uuid.split('-');
        if (parts.length !== 5) return undefined;
        const timeHigh = parts[0];
        const timeMid = parts[1];
        const timeLow = parts[2].substring(1);
        const timestampHex = timeHigh + timeMid + timeLow;
        const timestamp = parseInt(timestampHex, 16);
        const epochDiff = 122192928000000000n;
        const unixTimestamp = (BigInt(timestamp) - epochDiff) / 10000n;
        return new Date(Number(unixTimestamp));
    } catch {
        return undefined;
    }
};

export const extractV7Timestamp = (uuid: string): Date | undefined => {
    try {
        const hex = uuid.replace(/-/g, '');
        const timestampHex = hex.substring(0, 12);
        const timestamp = parseInt(timestampHex, 16);
        return new Date(timestamp);
    } catch {
        return undefined;
    }
};

export interface ValidationResult {
    valid: boolean;
    type?: string;
    version?: number;
    timestamp?: Date;
    versionName?: string;
}

export const validateIdentifier = (
    input: string,
    extractors: {
        extractV1: (uuid: string) => Date | undefined;
        extractV6: (uuid: string) => Date | undefined;
        extractV7: (uuid: string) => Date | undefined;
    }
): ValidationResult => {
    const trimmed = input.trim();
    if (!trimmed) return { valid: false };

    if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(trimmed)) {
        try {
            const timestamp = new Date(decodeTime(trimmed.toUpperCase()));
            return { valid: true, type: 'ULID', timestamp, versionName: 'ULID' };
        } catch {
            return { valid: false };
        }
    }

    const uuidWithHyphens =
        trimmed.length === 32
            ? `${trimmed.slice(0, 8)}-${trimmed.slice(8, 12)}-${trimmed.slice(12, 16)}-${trimmed.slice(16, 20)}-${trimmed.slice(20)}`
            : trimmed;

    if (uuidValidate(uuidWithHyphens)) {
        const version = uuidVersion(uuidWithHyphens);
        let timestamp: Date | undefined;
        let versionName = `v${version}`;

        switch (version) {
            case 1:
                timestamp = extractors.extractV1(uuidWithHyphens);
                versionName = 'v1 (Time + MAC)';
                break;
            case 3:
                versionName = 'v3 (MD5 Name)';
                break;
            case 4:
                versionName = 'v4 (Random)';
                break;
            case 5:
                versionName = 'v5 (SHA-1 Name)';
                break;
            case 6:
                timestamp = extractors.extractV6(uuidWithHyphens);
                versionName = 'v6 (Reordered Time)';
                break;
            case 7:
                timestamp = extractors.extractV7(uuidWithHyphens);
                versionName = 'v7 (Unix Time)';
                break;
        }

        return { valid: true, type: 'UUID', version, timestamp, versionName };
    }

    return { valid: false };
};
