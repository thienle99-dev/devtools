declare module 'ibantools' {
    export function isValidIBAN(iban: string): boolean;
    export function electronicFormatIBAN(iban: string): string | null;
    export function friendlyFormatIBAN(iban: string): string | null;
}
