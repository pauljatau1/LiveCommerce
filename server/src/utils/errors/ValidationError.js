class ValidationError extends Error {
    constructor(errors = []) {
        super('Validation failed');
        this.name = 'ValidationError';
        this.status = 422;
        this.errors = errors; // Optional: array of field-specific issues
    }
}

module.exports = ValidationError;