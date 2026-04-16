# Testing

## Tools
- **Jest**: Unit testing runner.
- **Jest Expo**: Optimized testing for React Native and Expo environments.
- **React Native Testing Library**: Used for component integration tests.

## Patterns
- Integration tests for core business logic (auth/submission) are prioritized over pure unit tests.
- Offline mode tests (detected in root `_layout.tsx`) verify app stability during connection loss.
