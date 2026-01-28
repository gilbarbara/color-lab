import { Route, Routes } from 'react-router';

import useAuth from '~/hooks/useAuth';
import usePageTracking from '~/hooks/usePageTracking';

import Header from '~/components/Header';
import Login from '~/components/Login';
import About from '~/pages/About';
import AuthCallback from '~/pages/AuthCallback';
import Generator from '~/pages/Generator';
import Palettes from '~/pages/Palettes';
import Privacy from '~/pages/Privacy';
import Terms from '~/pages/Terms';

export default function App() {
  const { isAuthenticated } = useAuth();

  usePageTracking();

  return (
    <div className="flex flex-col items-stretch min-h-screen">
      <Header />
      <main className="flex flex-col pt-16 items-stretch flex-1">
        <Routes>
          <Route element={<Generator />} path="/" />
          <Route element={<Generator />} path="/p/*" />
          <Route element={<About />} path="/about" />
          <Route element={<Palettes />} path="/palettes" />
          <Route element={<Privacy />} path="/privacy" />
          <Route element={<Terms />} path="/terms" />
          <Route element={<AuthCallback />} path="/auth/callback" />
        </Routes>
      </main>
      {!isAuthenticated && <Login />}
    </div>
  );
}
