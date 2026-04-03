import { Routes, Route, useNavigate } from 'react-router-dom';
import { Hero } from './components/Hero';
import { Problem } from './components/Problem';
import { Solution } from './components/Solution';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { BreathTest } from './components/BreathTest';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AnimatedBackground } from './components/AnimatedBackground';


function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-sans text-slate-900 selection:bg-blue-200 relative">
      <AnimatedBackground />
      <Navbar onStartScan={() => navigate('/test')} />

      <Routes>
        <Route 
          path="/" 
          element={
            <main className="pt-16">
              <div id="home">
                <Hero onStart={() => navigate('/test')} />
              </div>
              <div id="about">
                <Problem />
                <Solution />
              </div>
            </main>
          } 
        />
        <Route element={<ProtectedRoute />}>
          <Route 
            path="/dashboard" 
            element={<Dashboard />} 
          />
          <Route 
            path="/test" 
            element={
              <div className="pt-16">
                  <BreathTest />
              </div>
            } 
          />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <p>© 2026 BreathAI Diagnostics. All rights reserved.</p>
        <p className="mt-2 text-sm">For demonstration purposes only. Not a biological diagnostic tool.</p>
      </footer>
    </div>
  );
}

export default App;
