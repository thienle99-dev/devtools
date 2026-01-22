import type { IdType } from '@tools/crypto/uuid/constants';

export interface GeneratedId {
    value: string;
    type: IdType;
    timestamp?: Date;
}
