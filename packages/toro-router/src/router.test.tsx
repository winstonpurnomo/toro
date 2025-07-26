import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  createRoute,
  createRouter,
  findMatchingRoutes,
  Outlet,
  RouterOutlet,
  RouterProvider,
  useNavigate,
  useRouter,
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

describe('findMatchingRoutes', () => {
  const routes = new Map([
    ['/home', { key: '/home', component: () => 'Home Layout' }],
    ['/home/about', { key: '/home/about', component: () => 'About Page' }],
    [
      '/home/about/team',
      { key: '/home/about/team', component: () => 'Team Page' },
    ],
    ['/dashboard', { key: '/dashboard', component: () => 'Dashboard' }],
    [
      '/dashboard/settings',
      { key: '/dashboard/settings', component: () => 'Settings' },
    ],
  ]);

  it('finds exact match only when no parent routes exist', () => {
    const matches = findMatchingRoutes(routes, '/dashboard');
    expect(matches).toHaveLength(1);
    expect(matches[0].key).toBe('/dashboard');
  });

  it('finds all parent routes in hierarchical order', () => {
    const matches = findMatchingRoutes(routes, '/home/about/team');
    expect(matches).toHaveLength(3);
    expect(matches.map((r) => r.key)).toEqual([
      '/home',
      '/home/about',
      '/home/about/team',
    ]);
  });

  it('finds parent and child routes', () => {
    const matches = findMatchingRoutes(routes, '/home/about');
    expect(matches).toHaveLength(2);
    expect(matches.map((r) => r.key)).toEqual(['/home', '/home/about']);
  });

  it('returns empty array for non-matching routes', () => {
    const matches = findMatchingRoutes(routes, '/nonexistent');
    expect(matches).toHaveLength(0);
  });

  it('handles root path correctly', () => {
    const rootRoutes = new Map([
      ['/', { key: '/', component: () => 'Root' }],
      ['/home', { key: '/home', component: () => 'Home' }],
    ]);
    const matches = findMatchingRoutes(rootRoutes, '/home');
    expect(matches).toHaveLength(2);
    expect(matches.map((r) => r.key)).toEqual(['/', '/home']);
  });

  it('handles trailing slashes correctly', () => {
    const matches = findMatchingRoutes(routes, '/home/about/');
    expect(matches).toHaveLength(2);
    expect(matches.map((r) => r.key)).toEqual(['/home', '/home/about']);
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

describe('Layout routing with Outlet', () => {
  const Layout = createRoute({
    key: '/app',
    component: () => (
      <div data-testid="layout">
        <div>App Layout</div>
        <Outlet />
      </div>
    ),
  });

  const Home = createRoute({
    key: '/app/home',
    component: () => <div data-testid="home">Home Page</div>,
  });

  const About = createRoute<{ section?: string }>({
    key: '/app/about',
    args: z.object({ section: z.string().optional() }),
    component: ({ section }) => (
      <div data-testid="about">About Page {section && `- ${section}`}</div>
    ),
  });

  const router = createRouter({
    routes: [Layout, Home, About],
    initialRoute: '/app/home',
  });

  it('renders layout with nested content using Outlet', () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>
    );

    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('home')).toBeInTheDocument();
    expect(screen.getByText('App Layout')).toBeInTheDocument();
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('navigates between nested routes preserving layout', () => {
    function App() {
      const navigate = useNavigate();
      return (
        <>
          <button onClick={() => navigate({ to: '/app/about' })} type="button">
            Go to About
          </button>
          <RouterOutlet />
        </>
      );
    }

    render(
      <RouterProvider router={router}>
        <App />
      </RouterProvider>
    );

    // Initially shows home
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('home')).toBeInTheDocument();

    // Navigate to about
    fireEvent.click(screen.getByRole('button'));

    // Layout persists, content changes
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('about')).toBeInTheDocument();
    expect(screen.queryByTestId('home')).not.toBeInTheDocument();
  });

  it('passes args to nested route components', () => {
    function App() {
      const navigate = useNavigate();
      return (
        <>
          <button
            onClick={() =>
              navigate({
                to: '/app/about',
                params: { section: 'team' },
              })
            }
            type="button"
          >
            Go to About Team
          </button>
          <RouterOutlet />
        </>
      );
    }

    render(
      <RouterProvider router={router}>
        <App />
      </RouterProvider>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('about')).toHaveTextContent('About Page - team');
  });
});

describe('Multi-level nested layouts', () => {
  const AppLayout = createRoute({
    key: '/app',
    component: () => (
      <div data-testid="app-layout">
        <div>App Header</div>
        <Outlet />
      </div>
    ),
  });

  const DashboardLayout = createRoute({
    key: '/app/dashboard',
    component: () => (
      <div data-testid="dashboard-layout">
        <div>Dashboard Sidebar</div>
        <Outlet />
      </div>
    ),
  });

  const Settings = createRoute({
    key: '/app/dashboard/settings',
    component: () => <div data-testid="settings">Settings Page</div>,
  });

  const router = createRouter({
    routes: [AppLayout, DashboardLayout, Settings],
    initialRoute: '/app/dashboard/settings',
  });

  it('renders multiple nested layouts correctly', () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>
    );

    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('settings')).toBeInTheDocument();
    expect(screen.getByText('App Header')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Sidebar')).toBeInTheDocument();
    expect(screen.getByText('Settings Page')).toBeInTheDocument();
  });
});

describe('useRouter hook in nested contexts', () => {
  const Layout = createRoute({
    key: '/test',
    component: () => (
      <div>
        <TestCurrentRoute prefix="layout" />
        <Outlet />
      </div>
    ),
  });

  const Page = createRoute({
    key: '/test/page',
    component: () => (
      <div>
        <TestCurrentRoute prefix="page" />
      </div>
    ),
  });

  function TestCurrentRoute({ prefix }: { prefix: string }) {
    const { currentRoute, matchingRoutes } = useRouter();
    return (
      <div data-testid={`${prefix}-info`}>
        Current: {currentRoute}, Matches: {matchingRoutes.length}
      </div>
    );
  }

  const router = createRouter({
    routes: [Layout, Page],
    initialRoute: '/test/page',
  });

  it('provides consistent router context across nested outlets', () => {
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>
    );

    expect(screen.getByTestId('layout-info')).toHaveTextContent(
      'Current: /test/page, Matches: 2'
    );
    expect(screen.getByTestId('page-info')).toHaveTextContent(
      'Current: /test/page, Matches: 2'
    );
  });
});

describe('Edge cases', () => {
  it('handles empty matching routes gracefully', () => {
    const router = createRouter({
      routes: [],
      initialRoute: '/nonexistent',
    });

    // This should not crash
    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>
    );

    // Should render nothing
    expect(document.body.textContent).toBe('');
  });

  it('handles Outlet with no next route', () => {
    const OnlyRoute = createRoute({
      key: '/single',
      component: () => (
        <div data-testid="single">
          Single Route
          <Outlet />
        </div>
      ),
    });

    const router = createRouter({
      routes: [OnlyRoute],
      initialRoute: '/single',
    });

    render(
      <RouterProvider router={router}>
        <RouterOutlet />
      </RouterProvider>
    );

    expect(screen.getByTestId('single')).toHaveTextContent('Single Route');
    // Outlet should render nothing when there's no next route
  });
});
