# Backend Deployment

The backend application is deployed as part of the Electron application.

## Build Process

When you build the Electron app for production, the Python backend is packaged into a standalone executable using a tool like PyInstaller.

This executable is then included in the final Electron application bundle.

The `pnpm build` command in the root of the monorepo should be configured to handle this process.

## Continuous Integration (CI)

In a CI environment, you would typically have a pipeline that does the following:

1.  Installs all dependencies with `pnpm install`.
2.  Installs Python dependencies with `uv`.
3.  Builds the backend executable.
4.  Builds the frontend application.
5.  Packages the Electron app for different platforms.

This ensures that the backend is always built with the latest code and included in the final application bundle.
