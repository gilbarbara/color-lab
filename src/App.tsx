import { BrowserRouter, Route, Routes } from 'react-router';

import useAuth from '~/hooks/useAuth';

import Header from '~/components/Header';
import Login from '~/components/Login';
import AuthCallback from '~/pages/AuthCallback';
import Generator from '~/pages/Generator';

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <div className="flex flex-col items-stretch min-h-screen">
        <Header />
        <main className="flex flex-col pt-16 items-stretch flex-1">
          <Routes>
            <Route element={<Generator />} path="/" />
            <Route element={<Generator />} path="/p/*" />
            <Route element={<AuthCallback />} path="/auth/callback" />
          </Routes>
        </main>
        {!isAuthenticated && <Login />}
      </div>
    </BrowserRouter>
  );
}
