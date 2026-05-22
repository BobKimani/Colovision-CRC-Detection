import React, { useState, useEffect, createContext, useContext } from 'react';
import { AuthService, UserSession } from '../services/auth';

// Router Context
interface RouterContextType {
  currentRoute: string;
  navigate: (route: string) => void;
  query: Record<string, string>;
}

const RouterContext = createContext<RouterContextType | null>(null);

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a Router');
  }
  return context;
};

// Auth Context
interface AuthContextType {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Route types
interface Route {
  path: string;
  component: React.ComponentType<any>;
  requiresAuth?: boolean;
  isPublic?: boolean;
  redirectTo?: string;
}

interface RouterProps {
  routes: Route[];
  defaultRoute?: string;
}

// Router Component
export const Router: React.FC<RouterProps> = ({ routes = [], defaultRoute = '/' }) => {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      // If path is empty or just '/', use defaultRoute
      return path && path !== '/' ? path : defaultRoute;
    }
    return defaultRoute;
  });
  
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Parse query parameters
  const query = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const queryObj: Record<string, string> = {};
    params.forEach((value, key) => {
      queryObj[key] = value;
    });
    return queryObj;
  }, [currentRoute]);

  // Initialize auth state
  useEffect(() => {
    const session = AuthService.getCurrentSession();
    setUser(session);
    setIsLoading(false);
  }, []);

  // Handle authenticated user redirect
  useEffect(() => {
    if (!isLoading && user?.isAuthenticated && currentRoute === '/') {
      navigate('/detection');
    }
  }, [user, currentRoute, isLoading]);

  // Handle browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const newRoute = path && path !== '/' ? path : defaultRoute;
      setCurrentRoute(newRoute);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [defaultRoute]);

  const navigate = (route: string) => {
    // Ensure route starts with '/' for consistency
    const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
    setCurrentRoute(normalizedRoute);
    window.history.pushState({}, '', normalizedRoute);
  };

  // Find current route
  const currentRouteConfig = routes?.find(route => route.path === currentRoute);
  
  // Handle route not found
  if (!currentRouteConfig) {
    if (currentRoute !== defaultRoute) {
      navigate(defaultRoute);
      return null;
    }
    // If we can't find the default route either, show error
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Route Not Found</h1>
          <p className="text-gray-600">The requested route "{currentRoute}" does not exist.</p>
        </div>
      </div>
    );
  }

  // Handle auth requirements
  if (currentRouteConfig.requiresAuth && !user?.isAuthenticated) {
    if (currentRouteConfig.redirectTo) {
      navigate(currentRouteConfig.redirectTo);
      return null;
    }
  }

  // Handle public routes (redirect if already authenticated)
  if (currentRouteConfig.isPublic && user?.isAuthenticated) {
    navigate('/detection');
    return null;
  }

  const Component = currentRouteConfig.component;

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      <RouterContext.Provider value={{ currentRoute, navigate, query }}>
        {isLoading ? (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto animate-pulse">
                <div className="w-5 h-5 bg-white rounded"></div>
              </div>
              <p className="text-gray-600">Loading ColoVision...</p>
            </div>
          </div>
        ) : (
          <React.Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto animate-pulse">
                  <div className="w-5 h-5 bg-white rounded"></div>
                </div>
                <p className="text-gray-600">Loading page...</p>
              </div>
            </div>
          }>
            <Component />
          </React.Suspense>
        )}
      </RouterContext.Provider>
    </AuthContext.Provider>
  );
};

