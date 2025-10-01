# Contributing to LukuCheck 🎉

Thank you for your interest in contributing to LukuCheck! We're excited to have you join our fashion community platform. This guide will help you get started with contributing to the project.

## 🎯 Hacktoberfest 2025

We're participating in Hacktoberfest! Look for issues labeled `hacktoberfest` and `good first issue` to get started. All meaningful contributions are welcome!

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Community](#community)

## 📜 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful, inclusive, and constructive in all interactions.

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16.x or higher)
- npm or yarn package manager
- Git
- A Firebase account (for backend services)

### Development Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/LukuCheck.git
   cd LukuCheck
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   # Edit .env.local with your Firebase configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:9002](http://localhost:9002)

## 🤝 How to Contribute

### Types of Contributions We Welcome

- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation improvements**
- 🎨 **UI/UX enhancements**
- 🧪 **Tests**
- 🔧 **Performance optimizations**
- 🌐 **Accessibility improvements**
- 📱 **Mobile responsiveness**

### Finding Issues to Work On

1. Check our [Issues](https://github.com/lxmwaniky/LukuCheck/issues) page
2. Look for labels:
   - `good first issue` - Perfect for newcomers
   - `hacktoberfest` - Hacktoberfest eligible
   - `help wanted` - We need community help
   - `bug` - Bug reports
   - `enhancement` - Feature requests

## 🔄 Pull Request Process

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow our coding standards
   - Add tests if applicable
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new outfit filtering feature"
   ```
   
   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `style:` for formatting changes
   - `refactor:` for code refactoring
   - `test:` for adding tests
   - `chore:` for maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Fill out the PR template
   - Link any related issues

### Pull Request Guidelines

- **Title**: Use a clear, descriptive title
- **Description**: Explain what changes you made and why
- **Screenshots**: Include before/after screenshots for UI changes
- **Testing**: Describe how you tested your changes
- **Breaking Changes**: Clearly mark any breaking changes

## 📝 Issue Guidelines

### Reporting Bugs

When reporting bugs, please include:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (browser, OS, device)
- **Console errors** if any

### Requesting Features

For feature requests, please include:

- **Clear description** of the feature
- **Use case** - why is this needed?
- **Proposed solution** if you have ideas
- **Alternatives considered**
- **Additional context** or mockups

## 💻 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Prefer functional components with hooks

### React Components

- Use functional components
- Implement proper prop types
- Follow the existing component structure
- Use custom hooks for reusable logic
- Implement proper error boundaries

### Styling

- Use Tailwind CSS for styling
- Follow the existing design system
- Ensure mobile responsiveness
- Test on multiple screen sizes
- Maintain accessibility standards

### File Structure

```
src/
├── actions/          # Server actions
├── ai/              # AI-related functionality
├── app/             # Next.js app router pages
├── components/      # Reusable UI components
├── config/          # Configuration files
├── contexts/        # React contexts
├── hooks/           # Custom React hooks
└── lib/             # Utility functions
```

## 🧪 Testing

- Write unit tests for new functions
- Test React components with React Testing Library
- Ensure all tests pass before submitting PR
- Aim for good test coverage on new code

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🎨 Design Guidelines

- Follow the existing design language
- Use the established color palette
- Maintain consistent spacing and typography
- Ensure accessibility (WCAG 2.1 AA compliance)
- Test with screen readers when possible

## 📱 Mobile Development

This project supports mobile through Capacitor:

```bash
# Build for mobile
npm run build:mobile

# Sync with Capacitor
npm run cap:sync

# Run on Android
npm run cap:run:android
```

## 🌟 Recognition

Contributors will be:
- Added to our contributors list
- Mentioned in release notes for significant contributions
- Eligible for special contributor badges in the app

## 💬 Community

- **GitHub Discussions**: For general questions and ideas
- **Issues**: For bug reports and feature requests
- **Pull Requests**: For code contributions

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🙏 Thank You

Every contribution, no matter how small, makes LukuCheck better for everyone. We appreciate your time and effort in helping us build an amazing fashion community platform!

---

Happy coding! 🚀✨