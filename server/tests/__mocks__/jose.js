/**
 * Jest mock for jose library
 * 
 * This mock is necessary because jose v5+ is ESM-only and Jest doesn't
 * natively support ES Modules without additional configuration.
 * 
 * The mock provides stub implementations of the key functions used
 * in our Apple authentication service.
 */

const mockJWKS = {
    getPublicKey: jest.fn().mockResolvedValue({}),
};

const createRemoteJWKSet = jest.fn().mockReturnValue(mockJWKS);

const jwtVerify = jest.fn().mockResolvedValue({
    payload: {
        sub: 'mock-apple-user-id',
        iss: 'https://appleid.apple.com',
        aud: 'com.auqli.auqliapp',
        exp: Math.floor(Date.now() / 1000) + 3600,
        nonce: 'mock-nonce',
        email: 'test@example.com',
        email_verified: true,
        nonce_supported: true,
    },
    protectedHeader: {
        alg: 'RS256',
        kid: 'mock-key-id',
    },
});

module.exports = {
    createRemoteJWKSet,
    jwtVerify,
};
