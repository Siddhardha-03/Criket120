import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MatchPage from './pages/MatchPage';

function App() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />
      <main className="flex-grow-1 py-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/matches/:id" element={<MatchPage />} />
        </Routes>
      </main>
      <footer className="bg-dark text-light text-center py-3 mt-auto">
        <small>© {new Date().getFullYear()} Cricket Platform</small>
      </footer>
    </div>
  );
}

export default App;
