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

interface RouterContextType {
  currentRoute: string;
  currentArgs: any;
  navigate: (opts: { to: string; params?: any }) => void;
  routes: Map<string, Route<any>>;
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
    if (routeDef.args) {
      // will throw if invalid
      parsed = routeDef.args.parse(params);
    }
    setState({ route: to, args: parsed });
  };

  const contextValue: RouterContextType = {
    currentRoute: state.route,
    currentArgs: state.args,
    navigate,
    routes: router.routes,
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

export function RouterOutlet() {
  const { currentRoute, currentArgs, routes } = useRouter();
  const active = routes.get(currentRoute);
  if (!active) {
    return null;
  }
  return <>{active.component(currentArgs)}</>;
}
