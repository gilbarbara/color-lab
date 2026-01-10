import { BrowserRouter, Route, Routes } from 'react-router';

import Header from '~/components/Header';
import Generator from '~/pages/Generator';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col items-stretch min-h-screen">
        <Header />
        <main className="flex flex-col pt-16 items-stretch flex-1">
          <Routes>
            <Route element={<Generator />} path="/" />
            <Route element={<Generator />} path="/p/*" />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
