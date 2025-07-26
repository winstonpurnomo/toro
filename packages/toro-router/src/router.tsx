/** biome-ignore-all lint/suspicious/noExplicitAny: library file */
import { createContext, type ReactNode, useContext, useState } from 'react';
import type { ZodType } from 'zod';

export interface Route<TArgs = undefined> {
  key: string;
  args?: ZodType<TArgs>;
  component: (args: TArgs) => ReactNode;
}

export function createRoute<TArgs = undefined>(
  route: Route<TArgs>
): Route<TArgs> {
  return route;
}

export interface RouterConfig {
  routes: Route<any>[];
  initialRoute: string;
  initialArgs?: any;
}

export function createRouter({
  routes,
  initialRoute,
  initialArgs,
}: RouterConfig) {
  const routeMap = new Map<string, Route<any>>();
  for (const r of routes) {
    routeMap.set(r.key, r);
  }

  return {
    routes: routeMap,
    initialRoute,
    initialArgs,
  };
}

// Helper function to find all matching routes for layout support
export function findMatchingRoutes(
  routes: Map<string, Route<any>>,
  targetPath: string
): Route<any>[] {
  const matches: Route<any>[] = [];

  for (const [routePath, route] of routes) {
    if (isPathMatch(routePath, targetPath)) {
      matches.push(route);
    }
  }

  // Sort matches by path length (shortest first) for layout hierarchy
  return matches.sort((a, b) => a.key.length - b.key.length);
}

const NORMALIZED_REGEX = /\/$/;

function isPathMatch(routePath: string, targetPath: string): boolean {
  // Normalize paths (remove trailing slashes, but keep root as '/')
  const normalizedRoutePath =
    routePath === '/' ? '/' : routePath.replace(NORMALIZED_REGEX, '');
  const normalizedTargetPath =
    targetPath === '/' ? '/' : targetPath.replace(NORMALIZED_REGEX, '');

  // Exact match
  if (normalizedRoutePath === normalizedTargetPath) {
    return true;
  }

  // Layout match: route path is a prefix of target path
  // Special case for root path
  if (normalizedRoutePath === '/' && normalizedTargetPath !== '/') {
    return true;
  }

  // Regular prefix match
  if (normalizedTargetPath.startsWith(`${normalizedRoutePath}/`)) {
    return true;
  }

  return false;
}

interface RouterContextType {
  currentRoute: string;
  currentArgs: any;
  navigate: (opts: { to: string; params?: any }) => void;
  routes: Map<string, Route<any>>;
  matchingRoutes: Route<any>[];
  outletIndex: number;
}

const RouterContext = createContext<RouterContextType | null>(null);

interface RouterProviderProps {
  router: ReturnType<typeof createRouter>;
  children: ReactNode;
}

export function RouterProvider({ router, children }: RouterProviderProps) {
  const [state, setState] = useState<{
    route: string;
    args: any;
  }>({
    route: router.initialRoute,
    args: router.initialArgs,
  });

  const navigate = ({ to, params }: { to: string; params?: any }) => {
    const routeDef = router.routes.get(to);
    if (!routeDef) {
      throw new Error(`Route "${to}" not found`);
    }
    let parsed = params;
    if (routeDef.args && params !== undefined) {
      // will throw if invalid
      parsed = routeDef.args.parse(params);
    } else if (routeDef.args && params === undefined) {
      // Try to parse empty object if args are required
      parsed = routeDef.args.parse({});
    }
    setState({ route: to, args: parsed });
  };

  const matchingRoutes = findMatchingRoutes(router.routes, state.route);

  const contextValue: RouterContextType = {
    currentRoute: state.route,
    currentArgs: state.args,
    navigate,
    routes: router.routes,
    matchingRoutes,
    outletIndex: 0,
  };

  return (
    <RouterContext.Provider value={contextValue}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be inside RouterProvider');
  }
  return ctx;
}

export function useNavigate() {
  return useRouter().navigate;
}

// The main router outlet that renders the root layout
export function RouterOutlet() {
  const { matchingRoutes, currentArgs } = useRouter();

  if (matchingRoutes.length === 0) {
    return null;
  }

  // Start with the root layout (shortest path)
  const rootLayout = matchingRoutes[0];
  return <>{rootLayout.component(currentArgs)}</>;
}

// Outlet component for nested layouts
export function Outlet() {
  const routerContext = useRouter();
  const { matchingRoutes, outletIndex, currentArgs } = routerContext;

  // Find the next route in the hierarchy to render
  const nextRouteIndex = outletIndex + 1;

  if (nextRouteIndex >= matchingRoutes.length) {
    return null;
  }

  // Create a new context for the next route level
  const nextRoute = matchingRoutes[nextRouteIndex];
  const nextContextValue: RouterContextType = {
    ...routerContext,
    outletIndex: nextRouteIndex,
  };

  return (
    <RouterContext.Provider value={nextContextValue}>
      {nextRoute.component(currentArgs)}
    </RouterContext.Provider>
  );
}
