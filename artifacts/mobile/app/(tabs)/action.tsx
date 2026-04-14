// No imports needed for null return

/**
 * Dummy route to satisfy expo-router for the 'action' tab.
 * The actual button in _layout.tsx overrides the tab press,
 * so this screen is never actually shown.
 */
export default function ActionTabDummy() {
  return null;
}
