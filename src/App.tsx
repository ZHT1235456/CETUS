import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import Architecture from './routes/Architecture'
import Cloud from './routes/Cloud'
import Edge from './routes/Edge'
import Terminal from './routes/Terminal'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/architecture" replace />} />
        <Route path="architecture" element={<Architecture />} />
        <Route path="cloud" element={<Cloud />} />
        <Route path="edge" element={<Edge />} />
        <Route path="terminal" element={<Terminal />} />
        <Route path="*" element={<Navigate to="/architecture" replace />} />
      </Route>
    </Routes>
  )
}