import './App.css';
import Kiosk from './components/Kiosk';
import { Route, Routes } from 'react-router-dom';
import NextUpView from './views/NextUpView';
import AdminView from './views/AdminView';

function App() {
  return (
      <div className="App">
        <Routes>
          <Route path="/nextup" element={<NextUpView />} />
          <Route path="/nextup/:lineNumber" element={<NextUpView />} />
          <Route path="/admin" element={<AdminView />} />
          <Route path="/:lineNumber" element={<Kiosk />} />
          <Route path="/" element={<Kiosk />} />
        </Routes>
      </div>
  );
}

export default App;
