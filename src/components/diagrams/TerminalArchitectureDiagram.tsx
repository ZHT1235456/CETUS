import { useNavigate } from 'react-router-dom'
import { DIAG } from './colors'
import { FLEET } from '@/config/fleet'

export function TerminalArchitectureDiagram({ className }: { className?: string }) {
  const navigate = useNavigate()

  return (
    <svg
      viewBox="0 0 920 520"
      className={className}
      role="img"
      aria-label="端侧五域功能架构与数据交互"
    >
      <defs>
        <marker id="ta-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={DIAG.flowBlue} />
        </marker>
        <marker id="ta-teal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={DIAG.flowTeal} />
        </marker>
        <marker id="ta-em" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={DIAG.emergency} />
        </marker>
        <marker id="ta-bi" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M10,0 L0,5 L10,10 z" fill={DIAG.flowTeal} />
        </marker>
      </defs>

      <Ep x={16} y={40} label="边侧任务指令" />
      <Ep x={780} y={20} label="云侧紧急接管" emergency />
      <Ep x={780} y={80} label="艇间双向协同" />

      {/* 通信域 */}
      <Frame x={200} y={20} w={440} h={100} title="通信域" />
      <Mini x={230} y={55} label="通信时延" />
      <Mini x={365} y={55} label="丢包率" />
      <Mini x={500} y={55} label="信号强度" />

      {/* 感知 / 运动 / 机舱 */}
      <Frame x={80} y={160} w={160} h={140} title="感知域" />
      <Mini x={100} y={200} label="位置" />
      <Mini x={100} y={255} label="姿态" />

      <Frame x={300} y={160} w={160} h={140} title="运动控制域" />
      <Mini x={320} y={200} label="控制输入" />
      <Mini x={320} y={255} label="速度" />

      <Frame x={520} y={160} w={160} h={140} title="机舱域" />
      <Mini x={540} y={200} label="电源电量" />
      <Mini x={540} y={255} label="船舱温度" />

      {/* PHM */}
      <Frame x={180} y={360} w={400} h={110} title="预测与健康状态管理域" />
      <Mini x={205} y={405} w={100} label="异常检测" />
      <Mini x={330} y={405} w={100} label="故障状态监测" />
      <Mini x={455} y={405} w={100} label="健康状态评估" />

      {/* flows */}
      <path d="M136 64 L200 64" stroke={DIAG.flowBlue} strokeWidth="2" markerEnd="url(#ta-blue)" className="flow-edge" />
      <path d="M780 44 L640 50" stroke={DIAG.emergency} strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#ta-em)" className="flow-edge" />
      <path d="M780 104 L640 90" stroke={DIAG.flowTeal} strokeWidth="1.8" markerStart="url(#ta-bi)" markerEnd="url(#ta-teal)" className="flow-edge" />

      <path d="M300 120 L320 160" stroke={DIAG.flowBlue} strokeWidth="1.8" markerEnd="url(#ta-blue)" className="flow-edge" />
      <text x="250" y="145" fill={DIAG.text} fontSize="10">任务与控制相关指令</text>
      <path d="M420 160 L480 120" stroke={DIAG.flowTeal} strokeWidth="1.8" markerEnd="url(#ta-teal)" className="flow-edge" />
      <text x="430" y="145" fill={DIAG.text} fontSize="10">控制计算状态</text>
      <path d="M240 230 L300 230" stroke={DIAG.flowBlue} strokeWidth="1.8" markerEnd="url(#ta-blue)" className="flow-edge" />
      <text x="245" y="220" fill={DIAG.text} fontSize="10">位置、姿态</text>

      {/* 四域监测数据总线：通信域经运动控制/机舱域间隙(x=500)垂直下落，水平总线汇入 PHM，不穿越任何域框 */}
      <line x1={100} y1={340} x2={660} y2={340} stroke={DIAG.lineGray} strokeWidth="1.4" />
      <path d="M160 300 L160 340" stroke={DIAG.lineGray} strokeWidth="1.4" />
      <path d="M380 300 L380 340" stroke={DIAG.lineGray} strokeWidth="1.4" />
      <path d="M600 300 L600 340" stroke={DIAG.lineGray} strokeWidth="1.4" />
      <path d="M500 120 L500 360" fill="none" stroke={DIAG.lineGray} strokeWidth="1.4" />
      <text x="90" y="330" fill={DIAG.text} fontSize="10">四域监测数据</text>
      <path d="M580 415 C700 415, 700 160, 640 120" fill="none" stroke={DIAG.flowTeal} strokeWidth="1.8" markerEnd="url(#ta-teal)" className="flow-edge" />
      <text x="680" y="280" fill={DIAG.text} fontSize="10">异常、故障与健康评估上报</text>

      {/* vessel entry chips */}
      {FLEET.map((u, i) => (
        <g
          key={u.id}
          transform={`translate(${120 + i * 110}, 492)`}
          onClick={() => navigate(`/terminal/${u.id}`)}
          style={{ cursor: 'pointer' }}
        >
          <rect width="95" height="24" rx="6" fill={DIAG.endFill} stroke={DIAG.endLine} strokeWidth="1.5" />
          <text x="47.5" y="13" textAnchor="middle" dominantBaseline="middle" fill={DIAG.text} fontSize="11" fontWeight="700">
            {u.id}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Frame({
  x,
  y,
  w,
  h,
  title,
}: {
  x: number
  y: number
  w: number
  h: number
  title: string
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="10" fill={`${DIAG.endFill}7A`} stroke={DIAG.endLine} strokeWidth="2" />
      <text x={x + w / 2} y={y + 20} textAnchor="middle" fill={DIAG.endLine} fontSize="13" fontWeight="700" fontFamily="Chakra Petch, sans-serif">
        {title}
      </text>
    </g>
  )
}

function Mini({ x, y, w = 110, label }: { x: number; y: number; w?: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="36" rx="5" fill="#fff" stroke={DIAG.lineGray} strokeWidth="1.3" />
      <text x={x + w / 2} y={y + 20} textAnchor="middle" dominantBaseline="middle" fill={DIAG.text} fontSize="11" fontWeight="600">
        {label}
      </text>
    </g>
  )
}

function Ep({
  x,
  y,
  label,
  emergency,
}: {
  x: number
  y: number
  label: string
  emergency?: boolean
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={120}
        height="42"
        rx="6"
        fill={DIAG.softGray}
        stroke={emergency ? DIAG.emergency : DIAG.lineGray}
        strokeWidth="1.6"
      />
      <text x={x + 60} y={y + 23} textAnchor="middle" dominantBaseline="middle" fill={DIAG.text} fontSize="11" fontWeight="600">
        {label}
      </text>
    </g>
  )
}
