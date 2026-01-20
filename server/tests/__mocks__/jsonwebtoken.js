/**
 * Jest mock for jsonwebtoken library
 */

const jwt = {
    decode: jest.fn().mockReturnValue({
        header: { kid: 'mock-key-id', alg: 'RS256' },
        payload: {
            sub: 'mock-apple-user-id',
            iss: 'https://appleid.apple.com',
            aud: 'com.auqli.auqliapp',
            exp: Math.floor(Date.now() / 1000) + 3600,
            nonce: 'mock-nonce-hash',
            email: 'test@example.com',
        },
    }),
    verify: jest.fn().mockReturnValue({
        sub: 'mock-apple-user-id',
        iss: 'https://appleid.apple.com',
        aud: 'com.auqli.auqliapp',
        exp: Math.floor(Date.now() / 1000) + 3600,
        nonce: 'mock-nonce-hash',
        email: 'test@example.com',
    }),
};

module.exports = jwt;
