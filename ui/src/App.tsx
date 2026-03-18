import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Creators from './pages/Creators';
import Brands from './pages/Brands';
import Campaigns from './pages/Campaigns';
import Content from './pages/Content';
import Matching from './pages/Matching';
import Agents from './pages/Agents';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/content" element={<Content />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/agents" element={<Agents />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
