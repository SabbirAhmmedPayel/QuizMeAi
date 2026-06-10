import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Ask from './pages/Ask'
import Summarize from './pages/Summarize'
import Quiz from './pages/Quiz'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/summarize" element={<Summarize />} />
        <Route path="/quiz" element={<Quiz />} />
      </Route>
    </Routes>
  )
}
