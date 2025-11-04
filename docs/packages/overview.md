# Packages Overview

The `packages` directory is where you can create and maintain shared code that can be used across different applications in the monorepo.

## Purpose

The primary purpose of the `packages` directory is to promote code reuse and maintain a single source of truth for common functionality. This can include:

- **UI Components**: A library of React components that can be used in the frontend application.
- **Utility Functions**: Helper functions for common tasks like date formatting, API requests, etc.
- **Configuration**: Shared ESLint or Prettier configurations.
- **Type Definitions**: Shared TypeScript types.

## Creating a New Package

To create a new package, simply create a new directory in the `packages` directory and add a `package.json` file. Then, you can add your code and export it.

Turborepo will automatically detect the new package and make it available to other apps and packages in the monorepo.
