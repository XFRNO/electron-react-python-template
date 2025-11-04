# Frontend Development

This guide explains how to run the frontend application in a development environment.

## Running the Development Server

To start the frontend development server, navigate to the `apps/frontend` directory and run the following command:

```bash
cd apps/frontend
pnpm dev
```

This will start the Vite development server, which provides features like Hot Module Replacement (HMR) for a fast and efficient development experience.

Alternatively, you can run the entire application (Electron, React, and Python) in development mode from the root of the monorepo:

```bash
pnpm dev
```

## Building the Frontend

To build the frontend for production, run the following command from the `apps/frontend` directory:

```bash
cd apps/frontend
pnpm build
```

This will create a `dist` directory with the optimized and minified production build of the application.

## Integration with Electron

The Electron app is configured to load the frontend from the Vite development server in development mode. In production, it loads the built `index.html` file from the `dist` directory.

This is handled automatically by the `apps/electron/src/main.js` file.
