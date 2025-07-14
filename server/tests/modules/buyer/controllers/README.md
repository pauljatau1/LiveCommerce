# Buyer Controller Tests

This directory contains the test files for the buyer controller functionality. The tests have been split into smaller, more manageable files for better organization and maintainability.

## Test File Structure

### Main Test File
- **`buyer.controller.test.js`** - Main test suite with basic setup and general tests

### Specialized Test Files
- **`register.test.js`** - Tests for buyer registration functionality
- **`login.test.js`** - Tests for buyer login functionality  
- **`profile.test.js`** - Tests for profile management (getProfile, updateProfile, uploadProfileImage)
- **`otp.test.js`** - Tests for OTP functionality (verifyOTP, resendOTP)
- **`checkToken.test.js`** - Tests for token validation functionality

## Test Organization

Each test file follows a consistent structure:

### Unit Tests
- Test individual controller methods in isolation
- Mock service dependencies
- Test error handling and edge cases
- Verify correct service method calls

### Integration Tests
- Test HTTP endpoints using supertest
- Test complete request/response cycles
- Verify proper HTTP status codes and response formats
- Test authentication and authorization

### Validation Tests
- Test input validation
- Test different data formats and edge cases
- Test error responses for invalid inputs

### Edge Cases
- Test boundary conditions
- Test error scenarios
- Test performance with large inputs

## Running Tests

### Run All Buyer Controller Tests
```bash
npm test tests/modules/buyer/controllers/
```

### Run Specific Test File
```bash
npm test tests/modules/buyer/controllers/register.test.js
npm test tests/modules/buyer/controllers/login.test.js
npm test tests/modules/buyer/controllers/profile.test.js
npm test tests/modules/buyer/controllers/otp.test.js
npm test tests/modules/buyer/controllers/checkToken.test.js
```

### Run Tests with Coverage
```bash
npm test -- --coverage tests/modules/buyer/controllers/
```

## Test Dependencies

Each test file includes:
- **MongoDB Memory Server** - In-memory database for testing
- **Supertest** - HTTP testing library
- **Jest** - Testing framework
- **Mongoose** - MongoDB ODM
- **Mocked Services** - Service layer mocks for isolation

## Mock Strategy

- Services are mocked to isolate controller logic
- Firebase functions are mocked
- Database operations use in-memory MongoDB
- HTTP requests are tested with supertest

## Best Practices

1. **Isolation** - Each test is independent and doesn't affect others
2. **Clear Naming** - Test names clearly describe what is being tested
3. **Arrange-Act-Assert** - Tests follow the AAA pattern
4. **Comprehensive Coverage** - Tests cover success, error, and edge cases
5. **Maintainable** - Tests are easy to understand and modify

## Adding New Tests

When adding new functionality to the buyer controller:

1. **Identify the appropriate test file** based on functionality
2. **Add unit tests** for the controller method
3. **Add integration tests** for HTTP endpoints
4. **Add validation tests** for input validation
5. **Add edge case tests** for error scenarios

## Test Data

Test data is created fresh for each test to ensure isolation:
- Database is cleared before each test
- Mocks are reset before each test
- Test data is defined within each test

## Error Handling

Tests verify that:
- Proper error messages are returned
- Correct HTTP status codes are used
- Error responses follow the expected format
- Service errors are properly propagated

## Performance Considerations

- Tests use in-memory MongoDB for speed
- Mocks avoid external service calls
- Database operations are minimal
- Tests are designed to run quickly

## Maintenance

- Keep test files focused on specific functionality
- Update tests when controller methods change
- Ensure all new functionality has corresponding tests
- Maintain consistent test patterns across files 