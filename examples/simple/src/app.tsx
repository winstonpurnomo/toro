import { FullScreenBox } from 'fullscreen-ink';
import { Box, Text } from 'ink';
import {
  createRouter,
  Outlet,
  RouterOutlet,
  RouterProvider,
} from 'toro-router';
import z4 from 'zod/v4';
import Home from './screens/home.js';

const router = createRouter({
  routes: [
    {
      key: '/h',
      component: () => (
        <FullScreenBox borderStyle="bold" flexDirection="column" margin={1}>
          <Outlet />
        </FullScreenBox>
      ),
    },
    {
      key: '/h/home',
      component: () => (
        <Box borderStyle="single" margin={1}>
          <Home />
        </Box>
      ),
    },
    {
      key: '/h/about',
      args: z4.object({
        name: z4.string().optional(),
      }),
      component: ({ name }) => (
        <Box margin={1}>
          <Text>
            Hello, <Text color="blue">{name}</Text>
          </Text>
        </Box>
      ),
    },
  ],
  initialRoute: '/h/home',
});

export default function App() {
  return (
    <RouterProvider router={router}>
      <RouterOutlet />
    </RouterProvider>
  );
}
