# Test Suite for Auqli Server

This directory contains comprehensive tests for the Auqli server application.

## Test Structure

```
tests/
├── setup.js                                    # Jest setup configuration
├── README.md                                   # This file
└── modules/
    └── buyer/
        ├── controllers/
        │   └── buyer.controller.test.js        # Controller tests
        └── services/
            └── register.service.test.js        # Service tests
```

## Test Coverage

### Buyer Controller Tests (`buyer.controller.test.js`)

Tests for the buyer controller's register function:

- **Integration Tests**: Full HTTP request/response cycle testing
- **Unit Tests**: Direct function testing with mocked dependencies
- **Input Validation**: Email format, phone number format, password strength, username format
- **Edge Cases**: Long input fields, special characters, empty values
- **Error Handling**: Missing fields, duplicate data, internal server errors

### Register Service Tests (`register.service.test.js`)

Tests for the register service business logic:

- **Service Function Tests**: Core registration logic
- **Dependency Integration**: Validator, repository, Firebase, email service
- **Error Scenarios**: Validation failures, database errors, email failures
- **Helper Functions**: Email content generation, buyer object creation

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test -- buyer.controller.test.js
```

## Test Configuration

### Jest Configuration

The Jest configuration is defined in `package.json`:

- **Test Environment**: Node.js
- **Setup File**: `tests/setup.js`
- **Test Pattern**: `**/tests/**/*.test.js`
- **Coverage**: Excludes `server.js` and `app.js`
- **Coverage Reports**: Text, LCOV, and HTML formats

### Test Setup (`setup.js`)

- Loads environment variables for testing
- Sets up mock environment variables
- Configures global test timeout (30 seconds)
- Mocks console methods to reduce test noise

## Test Dependencies

- **Jest**: Testing framework
- **Supertest**: HTTP assertion library for integration tests
- **MongoDB Memory Server**: In-memory MongoDB for testing
- **Mongoose**: MongoDB ODM for database operations

## Mocking Strategy

### External Dependencies

- **Firebase**: Mocked for token management
- **SendGrid**: Mocked for email sending
- **Helper Functions**: Mocked for OTP and token generation

### Internal Dependencies

- **Repository Layer**: Mocked for data access
- **Validator Layer**: Mocked for input validation
- **Service Layer**: Mocked for business logic isolation

## Test Data

### Valid Registration Data

```javascript
const validRegistrationData = {
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  email: 'john.doe@example.com',
  country: 'NG',
  phoneNumber: '+2348012345678',
  password: 'password123',
  expoPushToken: 'test-expo-token'
};
```

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Cleanup**: Database is cleared before each test
3. **Mocking**: External dependencies are properly mocked
4. **Assertions**: Clear and specific assertions for expected behavior
5. **Error Testing**: Both success and failure scenarios are tested
6. **Edge Cases**: Boundary conditions and unusual inputs are tested

## Adding New Tests

### For New Controllers

1. Create test file in `tests/modules/[module]/controllers/`
2. Import the controller and dependencies
3. Mock external dependencies
4. Test both success and error scenarios
5. Include integration tests with HTTP requests

### For New Services

1. Create test file in `tests/modules/[module]/services/`
2. Mock repository and validator dependencies
3. Test business logic thoroughly
4. Test error handling and edge cases

### For New Validators

1. Create test file in `tests/modules/[module]/validators/`
2. Test valid and invalid input scenarios
3. Test edge cases and boundary conditions

## Coverage Goals

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## Continuous Integration

Tests are configured to run in CI/CD pipelines:

- **Pre-commit**: Run tests before committing
- **Pull Request**: Run tests on PR creation
- **Deployment**: Run tests before deployment

## Troubleshooting

### Common Issues

1. **MongoDB Connection**: Ensure MongoDB Memory Server is properly configured
2. **Mock Issues**: Check that all external dependencies are properly mocked
3. **Timeout Issues**: Increase Jest timeout for slow tests
4. **Environment Variables**: Ensure test environment variables are set

### Debug Mode

Run tests in debug mode:

```bash
npm test -- --verbose --detectOpenHandles
```

This will show more detailed output and help identify issues with async operations. 