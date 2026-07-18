import { useNavigate } from 'react-router-dom'
import { DIAG } from './colors'

export function EdgeArchitectureDiagram({ className }: { className?: string }) {
  const navigate = useNavigate()

  return (
    <svg
      viewBox="0 0 920 500"
      className={className}
      role="img"
      aria-label="岸基边缘侧功能架构与数据流"
    >
      <defs>
        <marker id="ea-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={DIAG.flowBlue} />
        </marker>
        <marker id="ea-teal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={DIAG.flowTeal} />
        </marker>
      </defs>

      <Ep x={16} y={70} label="云侧任务输入" />
      <Ep x={16} y={360} label="多艇状态输入" />

      <Frame x={150} y={30} w={180} h={220} title="任务管理" />
      <Box x={170} y={70} label="任务接收、解析与下发" />
      <Box x={170} y={130} label="任务执行协调" />
      <Box x={170} y={190} label="任务进度跟踪与反馈" />

      <Frame x={150} y={280} w={180} h={210} title="多艇状态汇聚" />
      <Box x={170} y={320} label="运行状态汇聚" />
      <Box x={170} y={380} label="健康状态汇聚" />
      <Box x={170} y={440} label="通信状态汇聚" />

      <Frame x={380} y={50} w={180} h={160} title="局部规划与在线重构" onClick={() => navigate('/edge/1')} />
      <Box x={400} y={95} label="局部航迹规划" onClick={() => navigate('/edge/1')} />
      <Box x={400} y={155} label="在线编队重构" onClick={() => navigate('/edge/1')} />

      <Frame x={380} y={280} w={180} h={210} title="边缘自治与应急处理" onClick={() => navigate('/edge/2')} />
      <Box x={400} y={320} label="局部故障监测" onClick={() => navigate('/edge/2')} />
      <Box x={400} y={380} label="边缘自主处理" onClick={() => navigate('/edge/2')} />
      <Box x={400} y={440} label="升级上报" onClick={() => navigate('/edge/2')} />

      <Ep x={720} y={100} label="向端侧下发任务" />
      <Ep x={720} y={380} label="向云侧反馈与上报" />

      <path d="M136 95 L150 95" stroke={DIAG.flowBlue} strokeWidth="2" markerEnd="url(#ea-blue)" className="flow-edge" />
      <path d="M136 385 L150 385" stroke={DIAG.flowTeal} strokeWidth="2" markerEnd="url(#ea-teal)" className="flow-edge" />
      <path d="M330 130 L400 130" stroke={DIAG.flowBlue} strokeWidth="2" markerEnd="url(#ea-blue)" className="flow-edge" />
      <text x="335" y="120" fill={DIAG.text} fontSize="10">任务约束</text>
      <path d="M330 160 C360 200, 360 240, 400 240" fill="none" stroke={DIAG.flowTeal} strokeWidth="1.8" markerEnd="url(#ea-teal)" className="flow-edge" />
      <text x="345" y="210" fill={DIAG.text} fontSize="10">多艇态势</text>
      <path d="M560 130 L720 125" stroke={DIAG.flowBlue} strokeWidth="2" markerEnd="url(#ea-blue)" className="flow-edge" />
      <text x="580" y="118" fill={DIAG.text} fontSize="10">局部航迹与编队调整</text>
      <path d="M330 385 L380 385" stroke={DIAG.lineGray} strokeWidth="1.6" />
      <path d="M560 400 L720 400" stroke={DIAG.flowTeal} strokeWidth="2" markerEnd="url(#ea-teal)" className="flow-edge" />
      <text x="580" y="390" fill={DIAG.text} fontSize="10">无法局部解决</text>
      <path d="M330 200 L330 250 L560 250 L720 140" fill="none" stroke={DIAG.flowBlue} strokeWidth="1.6" markerEnd="url(#ea-blue)" className="flow-edge" />
      <text x="600" y="230" fill={DIAG.text} fontSize="10">局部处置指令</text>
      <path d="M330 100 C500 40, 600 40, 720 100" fill="none" stroke={DIAG.flowTeal} strokeWidth="1.6" markerEnd="url(#ea-teal)" className="flow-edge" />
      <text x="520" y="48" fill={DIAG.text} fontSize="10">任务进度</text>
    </svg>
  )
}

function Frame({
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
      <rect x={x} y={y} width={w} height={h} rx="10" fill={`${DIAG.edgeFill}7A`} stroke={DIAG.edgeLine} strokeWidth="2" />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" fill={DIAG.edgeLine} fontSize="13" fontWeight="700" fontFamily="Chakra Petch, sans-serif">
        {title}
      </text>
    </g>
  )
}

function Box({
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
      <rect x={x} y={y} width={140} height="42" rx="5" fill="#fff" stroke={DIAG.lineGray} strokeWidth="1.4" />
      <text x={x + 70} y={y + 23} textAnchor="middle" dominantBaseline="middle" fill={DIAG.text} fontSize="11" fontWeight="600">
        {label}
      </text>
    </g>
  )
}

function Ep({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={120} height="48" rx="6" fill={DIAG.softGray} stroke={DIAG.lineGray} strokeWidth="1.6" />
      <text x={x + 60} y={y + 26} textAnchor="middle" dominantBaseline="middle" fill={DIAG.text} fontSize="11" fontWeight="600">
        {label}
      </text>
    </g>
  )
}
