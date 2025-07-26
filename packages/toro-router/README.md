# Toro

Toro is a simple router for terminal applications. It is inspired by [TanStack Router](https://tanstack.com/router) and [React Router](https://reactrouter.com/).

Toro stands for **T**erminal **O**rchestration and **RO**uting. We suffer from RAS syndrome because the package name `toro` is already taken by a 10-year old package with 0 dependents. Sigh.

## Installation

```bash
npm install toro-router
```

To use it, you need to wrap your application with the `RouterProvider` component.

## Usage

Create a router with the `createRouter` function, then pass it to the `RouterProvider` component. You can then call the `useNavigate` hook to navigate to other routes.

```tsx
// src/screens/home.tsx
import { Box } from 'ink';
import TextInput from 'ink-text-input';
import { useState } from 'react';
import { useNavigate } from 'toro-router';

export default function Home() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  return (
    <Box>
      <TextInput value={value} onChange={setValue} onSubmit={() => navigate({ to: 'about', params: { name: "Bob" } })} />
    </Box>
  );
}

// src/app.tsx
import { createRouter, RouterOutlet, RouterProvider } from 'toro-router';
import Home from './screens/home.js';
import z4 from 'zod/v4';
import { Box, Text } from 'ink';

const router = createRouter({
  routes: [
    {
      key: 'home',
      component: () => <Box margin={1}><Home /></Box>,
    },
    {
      key: 'about',
      args: z4.object({
        name: z4.string().optional(),
      }),
      component: ({ name }) => <Box margin={1}><Text>Hello, <Text color="blue">{name}</Text></Text></Box>,
    },
  ],
  initialRoute: 'home',
});

export default function App() {
  return (
    <RouterProvider router={router}>
      <RouterOutlet />
    </RouterProvider>
  );
}
```

## TODOs
- [ ] Add support for layout components
- [ ] More stringent type-safety
- [ ] Add unit tests
- [ ] Add CI/CD to lint, test and publish