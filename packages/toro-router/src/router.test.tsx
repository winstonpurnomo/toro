import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  createRoute,
  createRouter,
  RouterOutlet,
  RouterProvider,
  useNavigate,
} from './router';

describe('createRoute', () => {
  it('returns the exact same object', () => {
    const route = {
      key: 'test',
      component: (_args: undefined) => null,
    };
    const returned = createRoute(route);
    expect(returned).toBe(route);
  });
});

describe('createRouter', () => {
  const Home = createRoute<{ name: string }>({
    key: 'home',
    args: z.object({ name: z.string() }),
    component: ({ name }) => <div data-testid="home">Hello {name}</div>,
  });
  const About = createRoute({
    key: 'about',
    component: () => <div data-testid="about">About</div>,
  });

  it('builds a map of routes and preserves initialRoute/initialArgs', () => {
    const router = createRouter({
      routes: [Home, About],
      initialRoute: 'home',
      initialArgs: { name: 'Alice' },
    });
    expect(router.initialRoute).toBe('home');
    expect(router.initialArgs).toEqual({ name: 'Alice' });
    expect(router.routes.size).toBe(2);
    expect(router.routes.has('home')).toBe(true);
    expect(router.routes.get('about')).toBe(About);
  });

  it('defaults initialArgs to undefined if omitted', () => {
    const router = createRouter({
      routes: [Home, About],
      initialRoute: 'about',
    });
    expect(router.initialRoute).toBe('about');
    expect(router.initialArgs).toBeUndefined();
  });
});

describe('RouterProvider + RouterOutlet + navigation', () => {
  const Home = createRoute<{ name: string }>({
    key: 'home',
    args: z.object({ name: z.string() }),
    component: ({ name }) => <div data-testid="home">Home: {name}</div>,
  });
  const About = createRoute<undefined>({
    key: 'about',
    component: () => <div data-testid="about">About page</div>,
  });

  const router = createRouter({
    routes: [Home, About],
    initialRoute: 'home',
    initialArgs: { name: 'Bob' },
  });

  function App() {
    const navigate = useNavigate();
    return (
      <>
        <button onClick={() => navigate({ to: 'about' })} type="button">
          Go About
        </button>
        <RouterOutlet />
      </>
    );
  }

  it('renders the initial route with its args', () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>
    );
    expect(screen.getByTestId('home')).toHaveTextContent('Home: Bob');
  });

  it('navigates to another route on button click', async () => {
    render(
      <RouterProvider router={router}>
        <App />
      </RouterProvider>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByTestId('about')).toBeInTheDocument();
  });

  it('throws if navigating to an unknown route', () => {
    let nav: ReturnType<typeof useNavigate> | null = null;

    function CaptureNav() {
      nav = useNavigate();
      return null;
    }

    render(
      <RouterProvider router={router}>
        <CaptureNav />
      </RouterProvider>
    );

    expect(nav).toBeTruthy();
    expect(() => nav?.({ to: 'does-not-exist' })).toThrow(
      'Route "does-not-exist" not found'
    );
  });

  it('throws if params do not match its Zod schema', () => {
    let nav: ReturnType<typeof useNavigate> | null = null;

    function CaptureNav() {
      nav = useNavigate();
      return null;
    }

    render(
      <RouterProvider router={router}>
        <CaptureNav />
      </RouterProvider>
    );

    expect(nav).toBeTruthy();
    // missing { name: string } → ZodParseError
    expect(() => nav?.({ to: 'home', params: {} })).toThrow();
  });
});
