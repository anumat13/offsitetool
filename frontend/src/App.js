import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminManage from './pages/AdminManage';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import SessionCreate from './pages/SessionCreate';
import TeamSubmit from './pages/TeamSubmit';
import TeamVote from './pages/TeamVote';
import Results from './pages/Results';






import './styles/mongodb-theme.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/manage" element={<AdminManage />} />
        <Route path="/team/submit" element={<TeamSubmit />} />
        <Route path="/team/vote" element={<TeamVote />} />
        <Route path="/results" element={<Results />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
