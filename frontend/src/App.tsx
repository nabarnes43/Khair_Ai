import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import RoutineBuilderPage from './pages/RoutineBuilderPage'
import { Link } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background py-4">
        <nav className="container mx-auto mb-8 flex gap-4">
          <Link to="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Home</Link>
          <Link to="/routine-builder" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Routine Builder</Link>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/routine-builder" element={<RoutineBuilderPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App