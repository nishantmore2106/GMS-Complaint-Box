# Contributing to GMS Complaints Box 🤝

We welcome contributions! Please follow these guidelines to maintain project quality.

## 🛠️ Development Setup
1. Fork the repository and install dependencies using `pnpm`.
2. Configure your `.env` file with Supabase credentials.
3. Ensure you have the `expo-cli` installed globally.

## 🚀 Branching Strategy
- `main`: Production-ready code.
- `develop`: Integration branch for new features.
- `feature/*`: Development branch for specific features.
- `fix/*`: Bug fixes.

## 🎨 UI Guidelines (Soft UI)
This project uses a Neumorphic (Soft UI) design system. When adding new components:
- Use `Colors.bg` for backgrounds.
- Use subtle shadows (shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04).
- Maintain rounded corners (borderRadius: 20-32).
- Use `Inter` font family (400 Regular, 700 Bold, 900 Black).

## ✅ Pull Request Process
1. Run `pnpm run typecheck` before pushing.
2. Ensure your changes follow the existing project structure.
3. Provide a clear description of changes in the PR.
