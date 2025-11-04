# Frontend Documentation

This document provides an overview of the frontend application's structure and conventions.

## 🧩 Folder Structure Overview

`src/`
`├─ components/`
`│  ├─ ui/ — Shadcn UI primitives (Button, Input, Dialog)`
`│  ├─ layout/ — AppShell, Sidebar, Navbar`
`│  └─ shared/ — Reusable widgets like LoadingSpinner, EmptyState`
`│`
`├─ routes/`
`│  ├─ dashboard/`
`│  │   ├─ index.tsx`
`│  │   └─ comp/ — Components used only by dashboard (e.g., StatsPanel, Graph)`
`│  ├─ settings/`
`│  │   ├─ index.tsx`
`│  │   └─ comp/ — Components used only by settings (e.g., AccountForm)`
`│  └─ auth/`
`│      ├─ login.tsx`
`│      └─ comp/ — Components used only by auth (e.g., LoginForm)`
`│`
`├─ hooks/ — Reusable global hooks`
`├─ lib/ — Helpers, API utils, constants`
`└─ styles/ — Tailwind and global CSS`

### `src/components` vs. `src/routes/.../comp`

- **`src/components`**: This directory is for components that are shared across multiple routes. It is organized into three subdirectories:
  - **`ui/`**: Contains the base UI components from the Shadcn UI library.
  - **`layout/`**: For components that define the overall layout of the application, such as `Sidebar` and `Navbar`.
  - **`shared/`**: For other shared components that don't fit into the other categories, such as `LoadingSpinner` or `EmptyState`.

- **`src/routes/.../comp`**: Each route directory can have its own `comp` subdirectory for components that are only used within that specific route. This helps to keep the global component space clean and makes it easier to understand the scope of each component.

## 📘 Example: Adding a New Route

To create a new route called `profile`:

1.  Add a folder: `src/routes/profile/`
2.  Create a route file: `src/routes/profile/index.tsx`
3.  Add local components under `src/routes/profile/comp/`
4.  Use global components from `@/components/`

**Example:**

```tsx
// src/routes/profile/comp/ProfileCard.tsx
import { Card } from "@/components/ui/card";

export function ProfileCard({ user }) {
  return (
    <Card className="p-4">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </Card>
  );
}
```

```tsx
// src/routes/profile/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { ProfileCard } from "./comp/ProfileCard";

export const Route = createFileRoute("/profile")({
  component: ProfileComponent,
});

function ProfileComponent() {
  const user = { name: "John Doe", email: "john.doe@example.com" }; // Fetch user data here

  return (
    <div>
      <h1>Profile</h1>
      <ProfileCard user={user} />
    </div>
  );
}
```
