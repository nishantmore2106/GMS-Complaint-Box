# Conventions

## Coding Standards
- **Functional Components**: All UI is built using React Functional Components and Hooks.
- **Async/Await**: Heavy usage of async/await for data fetching and haptics, ideally wrapped in safe try/catch blocks to avoid UI blocking.
- **TypeScript**: Strict typing for context and component props.

## Naming & Organization
- **Prefixing**: Console logs are often prefixed with context (e.g., `[MobileSubmit]`, `[WebWebSubmit]`).
- **File Based Routing**: Route names follow standard `expo-router` conventions (e.g., `[id].tsx` for dynamic segments).

## UI/UX Patterns
- **SoftUI**: Use of soft shadows, blurred layers (glassmorphism), and rounded corners (20px radii).
- **Haptic Confirmations**: Using `expo-haptics` for success/error feedback on critical actions.
- **Loading States**: Immediate `setIsSubmitting(true)` on button press to provide instant visual feedback.
