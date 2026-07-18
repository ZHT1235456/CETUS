import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import Architecture from './routes/Architecture'
import CloudLayout from './routes/cloud/CloudLayout'
import CloudOverview from './routes/cloud/CloudOverview'
import CloudDecision from './routes/cloud/CloudDecision'
import CloudMonitor from './routes/cloud/CloudMonitor'
import CloudLifecycle from './routes/cloud/CloudLifecycle'
import CloudScenePage from './routes/cloud/CloudScenePage'
import EdgeLayout from './routes/edge/EdgeLayout'
import EdgeOverview from './routes/edge/EdgeOverview'
import EdgeStation from './routes/edge/EdgeStation'
import TerminalLayout from './routes/terminal/TerminalLayout'
import TerminalOverview from './routes/terminal/TerminalOverview'
import TerminalVessel from './routes/terminal/TerminalVessel'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/architecture" replace />} />
        <Route path="architecture" element={<Architecture />} />

        <Route path="cloud" element={<CloudLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<CloudOverview />} />
          <Route path="decision" element={<CloudDecision />} />
          <Route path="monitor" element={<CloudMonitor />} />
          <Route path="lifecycle" element={<CloudLifecycle />} />
          <Route path="scene" element={<CloudScenePage />} />
        </Route>

        <Route path="edge" element={<EdgeLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<EdgeOverview />} />
          <Route path=":stationId" element={<EdgeStation />} />
        </Route>

        <Route path="terminal" element={<TerminalLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<TerminalOverview />} />
          <Route path=":usvId" element={<TerminalVessel />} />
        </Route>

        <Route path="*" element={<Navigate to="/architecture" replace />} />
      </Route>
    </Routes>
  )
}
