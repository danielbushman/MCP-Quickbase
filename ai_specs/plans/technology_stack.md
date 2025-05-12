# Technology Stack for v2

## Language & Platform

For v2, we are standardizing on a **TypeScript-only** codebase:

- **Language**: TypeScript 5.x
- **Runtime**: Node.js 18+
- **Framework**: Express.js for HTTP server

## Primary Technology Decisions

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Language | TypeScript | Strong typing, better code quality, modern JS features |
| HTTP Server | Express.js | Lightweight, widely used, excellent middleware system |
| HTTP Client | Native fetch API | Built into Node.js, no additional dependencies |
| Caching | node-cache | Simple in-memory caching with TTL support |
| Testing | Jest | Feature-rich testing framework with mocking capabilities |
| Linting | ESLint | Industry standard for TypeScript linting |
| Formatting | Prettier | Consistent code style |
| Docs | Markdown | Simple, readable documentation format |

## Explicit Technology Restrictions

To maintain a clean and consistent codebase, the following restrictions apply:

1. **NO PYTHON CODE**: v2 is a TypeScript-only project. All functionality must be implemented in TypeScript.

2. **No Mixed-Language Components**: All components must be written in TypeScript, including utilities, tests, and scripts.

3. **Minimize Dependencies**: Use built-in Node.js/TypeScript features when possible before adding external dependencies.

## Advantages of TypeScript-Only Approach

1. **Consistency**: Single language throughout the codebase
2. **Type Safety**: Catch errors at compile time
3. **Developer Experience**: Better tooling and IDE support
4. **Maintainability**: Easier to understand and modify code
5. **Deployment**: Simpler deployment with single runtime
6. **Documentation**: TypeScript interfaces serve as self-documenting code

## Migration Approach

While v1 used a mix of Python and JavaScript, v2 is a complete rewrite in TypeScript. Rather than directly converting Python code to TypeScript, we are:

1. Understanding the core functionality of each Python component
2. Reimplementing that functionality in idiomatic TypeScript
3. Taking advantage of TypeScript's type system
4. Utilizing JavaScript ecosystem libraries when appropriate

This ensures we maintain functionality while fully embracing the benefits of TypeScript.