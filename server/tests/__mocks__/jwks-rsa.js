/**
 * Jest mock for jwks-rsa library
 */

const jwksClient = jest.fn().mockReturnValue({
    getSigningKey: jest.fn((kid, callback) => {
        callback(null, {
            getPublicKey: jest.fn().mockReturnValue('mock-public-key'),
        });
    }),
});

module.exports = jwksClient;
