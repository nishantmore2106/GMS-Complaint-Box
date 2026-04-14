export const Colors = {
  // Backgrounds
  bg: "#FFFFFF", // Pure white base
  bgGradient: ["#FFFFFF", "#FFFFFF"],
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceBorder: "rgba(0,0,0,0.03)",
  card: "#FFFFFF",

  // Pastel Gradients (Mesh matching screenshot)
  heroGradient: ["#FFE4E1", "#E0F7FA", "#E8F5E9"], // Soft Pink to Cyan to Mint
  moduleGradient1: ["#FDF2F8", "#E0F2FE"], // Pink to Blue
  moduleGradient2: ["#F0FDF4", "#E0F2FE"], // Mint to Blue
  navCenterGradient: ["#FBCFE8", "#BAE6FD"], // Glowing center button

  // Nav Bar
  navBg: "#0B0F19", // Dark floating pill
  navActive: "#BAE6FD", // Light blue icon highlight
  navInactive: "#6B7280",

  // Brand / Actions
  primary: "#111827", // Standard buttons are dark
  primaryMuted: "#374151",
  secondary: "#F3F4F6", // Light grey for circular icon buttons
  secondaryMuted: "#E5E7EB",
  
  // High-Fidelity Accents
  accent: "#111827",
  accentLight: "#374151",
  orangePill: "#F97316",
  
  // Status (Tonal)
  pending: "#F97316",
  pendingBg: "#FFF7ED",
  inProgress: "#3B82F6",
  inProgressBg: "#EFF6FF",
  resolved: "#10B981",
  resolvedBg: "#ECFDF5",

  // Typography
  text: "#111827",
  textSub: "#374151",
  textMuted: "#6B7280",

  // Helpers
  white: "#FFFFFF",
  danger: "#EF4444",
  success: "#10B981",
  warning: "#F97316",

  // Borders & Shadows (Ambient)
  border: "rgba(0,0,0,0.03)",
  shadowColor: "#000000",
  shadowOpacity: 0.04,
  shadowRadius: 20,

  // Dark Mode Tokens (Premium Slate)
  dark: {
    bg: "#0F172A",
    surface: "#1E293B",
    surfaceElevated: "#334155",
    border: "rgba(255,255,255,0.06)",
    text: "#F8FAFC",
    textSub: "#94A3B8",
    textMuted: "#64748B",
    heroGradient: ["#1E1B4B", "#312E81", "#1E293B"],
    cardGradient: ["#1E1B4B", "#0F172A"],
    accent: "#3B82F6",
    accentMuted: "rgba(59,130,246,0.1)",
  }
};

export default {
  light: {
    text: "#2D3337",
    background: "#F8F9FB",
    tint: "#43627E",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#43627E",
  },
  dark: {
    text: "#F8FAFC",
    background: "#0F172A",
    tint: "#3B82F6",
    tabIconDefault: "#64748B",
    tabIconSelected: "#3B82F6",
  }
};
