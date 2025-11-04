# Using Packages

This guide explains how to use the shared packages in your applications.

## Importing Packages

To use a package in one of your applications (e.g., the `frontend` app), you first need to add it as a dependency in the `package.json` file of that application.

For example, to use a package named `@my-company/ui-components`, you would add the following to the `dependencies` section of `apps/frontend/package.json`:

```json
{
  "dependencies": {
    "@my-company/ui-components": "workspace:*"
  }
}
```

The `workspace:*` protocol tells pnpm to use the local version of the package from the monorepo.

After adding the dependency, you can import the package in your code as you would with any other package:

```javascript
import { Button } from '@my-company/ui-components';
```

## Development Workflow

When you make changes to a package, Turborepo will automatically rebuild it and update the applications that depend on it. This allows for a seamless development experience, as you can see your changes reflected in real-time.
