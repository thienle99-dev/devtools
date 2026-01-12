import forge from 'node-forge';

export const generateKeyPair = async (bits: number): Promise<{ publicKey: string; privateKey: string }> => {
    return new Promise((resolve, reject) => {
        forge.pki.rsa.generateKeyPair({ bits, workers: -1 }, (err, keypair) => {
            if (err) return reject(err);
            const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
            const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
            resolve({ publicKey, privateKey });
        });
    });
};

export const rsaEncrypt = (content: string, publicKeyPem: string): string => {
    try {
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
        const encrypted = publicKey.encrypt(content, 'RSA-OAEP', {
             md: forge.md.sha256.create(),
             mgf1: {
                 md: forge.md.sha1.create()
             }
        });
        return forge.util.encode64(encrypted);
    } catch (e) {
        throw new Error('Encryption failed. Check your public key.');
    }
};

export const rsaDecrypt = (encryptedContentBase64: string, privateKeyPem: string): string => {
    try {
        const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
        const encrypted = forge.util.decode64(encryptedContentBase64);
        const decrypted = privateKey.decrypt(encrypted, 'RSA-OAEP', {
             md: forge.md.sha256.create(),
             mgf1: {
                 md: forge.md.sha1.create()
             }
        });
        return decrypted;
    } catch (e) {
        throw new Error('Decryption failed. Check your private key or scrambled content.');
    }
};

export const rsaSign = (content: string, privateKeyPem: string, hashAlgo: 'sha1' | 'sha256' | 'sha512' = 'sha256'): string => {
    try {
        const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
        const md = forge.md[hashAlgo].create();
        md.update(content, 'utf8');
        const signature = privateKey.sign(md);
        return forge.util.encode64(signature);
    } catch (e) {
        throw new Error('Signing failed.');
    }
};

export const rsaVerify = (content: string, signatureBase64: string, publicKeyPem: string, hashAlgo: 'sha1' | 'sha256' | 'sha512' = 'sha256'): boolean => {
    try {
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
        const md = forge.md[hashAlgo].create();
        md.update(content, 'utf8');
        const signature = forge.util.decode64(signatureBase64);
        return publicKey.verify(md.digest().bytes(), signature);
    } catch (e) {
        return false;
    }
};
