# Frontend Deployment

The frontend application is deployed as part of the Electron application.

## Build Process

When you build the Electron app for production, the `pnpm build` command is run for the frontend. This creates a production-ready build of the React application in the `apps/frontend/dist` directory.

The Electron app is then configured to load the `index.html` file from this directory.

## Continuous Integration (CI)

In a CI environment, you would typically have a pipeline that does the following:

1.  Installs all dependencies with `pnpm install`.
2.  Builds all apps and packages with `pnpm build`.
3.  Packages the Electron app for different platforms (e.g., Windows, macOS, Linux).

This ensures that the frontend is always built with the latest code and included in the final application bundle.
