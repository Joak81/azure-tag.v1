import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Setup test database or mock services if needed
beforeAll(async () => {
  // Initialize test environment
});

afterAll(async () => {
  // Cleanup test environment
});

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});