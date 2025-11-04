# Frontend Folder Structure

The `apps/frontend` directory is structured to be clean, organized, and scalable.

```
apps/frontend/
├── src/
│   ├── components/   # Reusable UI components
│   │   ├── ui/       # Shadcn UI components
│   │   └── ...
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions
│   ├── routes/       # TanStack Router route components
│   ├── types/        # TypeScript type definitions
│   ├── main.tsx      # Main entry point of the React app
│   └── index.css     # Global CSS styles
├── public/         # Static assets
├── index.html      # Main HTML file
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Key Directories

- **`src/components`**: This is where you'll find all the reusable UI components. The `ui` subdirectory contains the components from the Shadcn UI library.
- **`src/hooks`**: Custom React hooks that can be shared across the application.
- **`src/lib`**: Utility functions and other shared code.
- **`src/routes`**: Components that are used as pages for the TanStack Router.
- **`src/types`**: TypeScript type definitions, especially for API responses and Electron IPC.

This structure is designed to be flexible. Feel free to create new directories as needed to organize your code.
