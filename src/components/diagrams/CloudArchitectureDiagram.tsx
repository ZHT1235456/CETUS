import { useNavigate } from 'react-router-dom'
import { DIAG } from './colors'

export function CloudArchitectureDiagram({ className }: { className?: string }) {
  const navigate = useNavigate()

  return (
    <svg
      viewBox="0 0 920 500"
      className={className}
      role="img"
      aria-label="云侧功能架构与数据流"
    >
      <defs>
        <marker id="ca-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={DIAG.flowBlue} />
        </marker>
        <marker id="ca-teal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={DIAG.flowTeal} />
        </marker>
        <marker id="ca-em" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={DIAG.emergency} />
        </marker>
      </defs>

      <Endpoint x={0} y={210} w={100} label="边侧汇聚数据" />

      {/* 数据收集 */}
      <GroupFrame x={130} y={70} w={170} h={280} title="数据收集" />
      <Sub x={150} y={110} label="运行状态数据采集" />
      <Sub x={150} y={190} label="任务数据采集" />
      <Sub x={150} y={270} label="健康数据采集" />

      {/* 状态检测与历史回溯 */}
      <GroupFrame x={340} y={70} w={170} h={340} title="状态检测与历史回溯" onClick={() => navigate('/cloud/monitor')} />
      <Sub x={360} y={120} label="实时状态监测" onClick={() => navigate('/cloud/monitor')} />
      <Sub x={360} y={320} label="历史过程回溯" onClick={() => navigate('/cloud/monitor')} />

      {/* 集群决策 */}
      <GroupFrame x={550} y={40} w={170} h={220} title="集群决策" onClick={() => navigate('/cloud/decision')} />
      <Sub x={570} y={80} label="全局航迹规划" onClick={() => navigate('/cloud/decision')} />
      <Sub x={570} y={145} label="任务重规划" onClick={() => navigate('/cloud/decision')} />
      <Sub x={570} y={210} label="应急响应与接管" onClick={() => navigate('/cloud/decision')} />

      {/* 全生命周期 */}
      <GroupFrame x={550} y={300} w={170} h={196} title="全生命周期数据管理" onClick={() => navigate('/cloud/lifecycle')} />
      <Sub x={570} y={334} label="健康状态管理" onClick={() => navigate('/cloud/lifecycle')} />
      <Sub x={570} y={390} label="故障与寿命管理" onClick={() => navigate('/cloud/lifecycle')} />
      <Sub x={570} y={446} label="日志与档案管理" onClick={() => navigate('/cloud/lifecycle')} />

      <Endpoint x={760} y={140} label="向边侧下发决策" />
      <Endpoint x={760} y={220} label="紧急直达端侧" emergency />

      {/* flows */}
      <path d="M100 235 L130 235" stroke={DIAG.flowTeal} strokeWidth="2" markerEnd="url(#ca-teal)" className="flow-edge" />
      <path d="M300 145 L360 145" stroke={DIAG.flowBlue} strokeWidth="2" markerEnd="url(#ca-blue)" className="flow-edge" />
      <text x="305" y="135" fill={DIAG.text} fontSize="10">实时数据</text>
      <path d="M510 145 L570 160" stroke={DIAG.flowBlue} strokeWidth="2" markerEnd="url(#ca-blue)" className="flow-edge" />
      <text x="505" y="130" fill={DIAG.text} fontSize="10">当前集群态势</text>
      <path d="M720 150 L760 160" stroke={DIAG.flowBlue} strokeWidth="2" markerEnd="url(#ca-blue)" className="flow-edge" />
      <path d="M720 240 L760 240" stroke={DIAG.emergency} strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#ca-em)" className="flow-edge" />
      <path d="M215 350 L215 400 L550 400" fill="none" stroke={DIAG.flowTeal} strokeWidth="1.8" markerEnd="url(#ca-teal)" className="flow-edge" />
      <text x="280" y="392" fill={DIAG.text} fontSize="10">归档数据</text>
      <path d="M550 445 L445 445 L445 370" fill="none" stroke={DIAG.lineGray} strokeWidth="1.8" strokeDasharray="5 4" markerEnd="url(#ca-blue)" className="flow-edge" />
      <text x="460" y="465" fill={DIAG.text} fontSize="10">历史数据查询</text>
    </svg>
  )
}

function GroupFrame({
  x,
  y,
  w,
  h,
  title,
  onClick,
}: {
  x: number
  y: number
  w: number
  h: number
  title: string
  onClick?: () => void
}) {
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <rect x={x} y={y} width={w} height={h} rx="10" fill={`${DIAG.cloudFill}7A`} stroke={DIAG.cloudLine} strokeWidth="2" />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" fill={DIAG.cloudLine} fontSize="13" fontWeight="700" fontFamily="Chakra Petch, sans-serif">
        {title}
      </text>
    </g>
  )
}

function Sub({
  x,
  y,
  label,
  onClick,
}: {
  x: number
  y: number
  label: string
  onClick?: () => void
}) {
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <rect x={x} y={y} width={130} height="42" rx="5" fill="#fff" stroke={DIAG.lineGray} strokeWidth="1.4" />
      <text x={x + 65} y={y + 23} textAnchor="middle" dominantBaseline="middle" fill={DIAG.text} fontSize="11" fontWeight="600">
        {label}
      </text>
    </g>
  )
}

function Endpoint({
  x,
  y,
  w = 120,
  label,
  emergency,
}: {
  x: number
  y: number
  w?: number
  label: string
  emergency?: boolean
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height="48"
        rx="6"
        fill={DIAG.softGray}
        stroke={emergency ? DIAG.emergency : DIAG.lineGray}
        strokeWidth="1.6"
      />
      <text x={x + w / 2} y={y + 26} textAnchor="middle" dominantBaseline="middle" fill={DIAG.text} fontSize="11" fontWeight="600">
        {label}
      </text>
    </g>
  )
}
