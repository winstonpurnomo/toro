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
