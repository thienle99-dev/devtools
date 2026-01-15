declare module 'node-forge' {
  export interface PublicKey {
    encrypt(data: string, scheme?: string, options?: any): string;
    verify(digest: string, signature: string): boolean;
  }

  export interface PrivateKey {
    decrypt(data: string, scheme?: string, options?: any): string;
    sign(md: any): string;
  }

  export interface CertificationRequest {
    publicKey: PublicKey;
    setSubject(attrs: Array<{ name: string; value: string }>): void;
    sign(privateKey: PrivateKey): void;
  }

  export namespace pki {
    export namespace rsa {
      export interface KeyPair {
        publicKey: PublicKey;
        privateKey: PrivateKey;
      }
      // Async version with callback
      export function generateKeyPair(
        options: { bits: number; workers: number },
        callback: (err: Error | null, keypair: KeyPair | null) => void
      ): void;
      // Sync version (returns KeyPair directly)
      export function generateKeyPair(bits: number): KeyPair;
    }

    // PEM conversion methods
    export function publicKeyToPem(key: PublicKey): string;
    export function privateKeyToPem(key: PrivateKey): string;
    export function publicKeyFromPem(pem: string): PublicKey;
    export function privateKeyFromPem(pem: string): PrivateKey;

    // Certificate Signing Request
    export function createCertificationRequest(): CertificationRequest;
    export function certificationRequestToPem(csr: CertificationRequest): string;
  }

  export interface MessageDigest {
    create(): any;
  }

  export interface MdNamespace {
    sha1: MessageDigest;
    sha256: MessageDigest;
    sha512: MessageDigest;
  }

  export namespace md {
    export namespace sha256 {
      export function create(): any;
    }
    export namespace sha1 {
      export function create(): any;
    }
    export namespace sha512 {
      export function create(): any;
    }
  }

  // Merge interface with namespace for index access
  export interface md extends MdNamespace {
    [key: string]: MessageDigest;
  }

  export namespace util {
    export function encode64(data: string): string;
    export function decode64(data: string): string;
  }

  export namespace cipher {
    export function createCipher(algorithm: string, key: any): any;
    export function createDecipher(algorithm: string, key: any): any;
  }
}

