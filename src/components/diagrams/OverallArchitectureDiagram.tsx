import { useNavigate } from 'react-router-dom'
import { DIAG } from './colors'

const FONT_DISPLAY = 'Chakra Petch, sans-serif'
const FONT_BODY = 'Sora, sans-serif'
const FONT_MONO = 'JetBrains Mono, monospace'
const MESH = '#6E87A0'

const HOVER_LIFT =
  'transition-all duration-300 hover:-translate-y-1 hover:[filter:drop-shadow(0_5px_10px_rgba(26,64,110,0.22))]'

type Props = {
  className?: string
}

export function OverallArchitectureDiagram({ className }: Props) {
  const navigate = useNavigate()

  return (
    <svg
      viewBox="0 0 1000 900"
      className={className}
      role="img"
      aria-label="云侧-边侧-端侧协同的无人艇集群系统总体架构"
    >
      <defs>
        <marker id="oa-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={DIAG.flowBlue} />
        </marker>
        <marker id="oa-teal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={DIAG.flowTeal} />
        </marker>
        <marker id="oa-teal-bi" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M10,0 L0,5 L10,10 z" fill={DIAG.flowTeal} />
        </marker>
        <marker id="oa-gray" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={DIAG.lineGray} />
        </marker>
        <marker id="oa-gray-bi" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M10,0 L0,5 L10,10 z" fill={DIAG.lineGray} />
        </marker>
        <marker id="oa-mesh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={MESH} />
        </marker>
        <marker id="oa-mesh-bi" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M10,0 L0,5 L10,10 z" fill={MESH} />
        </marker>
        <marker id="oa-em" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={DIAG.emergency} />
        </marker>

        <linearGradient id="oa-g-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E9F2FA" />
        </linearGradient>
        <linearGradient id="oa-g-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FBEFDA" />
        </linearGradient>
        <linearGradient id="oa-g-end" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EAF6E8" />
        </linearGradient>
        <linearGradient id="oa-g-cyl-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDF4E3" />
          <stop offset="100%" stopColor="#F2D7A9" />
        </linearGradient>
        <linearGradient id="oa-g-cyl-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F2F9F0" />
          <stop offset="100%" stopColor="#CFE7CC" />
        </linearGradient>
        <linearGradient id="oa-g-ship" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4F9FD" />
          <stop offset="100%" stopColor="#D8E8F5" />
        </linearGradient>
        <pattern id="oa-grid" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0V22" fill="none" stroke="rgba(77,120,168,0.13)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* ── Legend ─────────────────────────────────────────────── */}
      <g fontFamily={FONT_BODY} fontSize="10.5" fill={DIAG.text}>
        <line x1={40} y1={10} x2={64} y2={10} stroke={DIAG.flowBlue} strokeWidth={2.4} />
        <text x={70} y={13.5}>下行任务</text>
        <line x1={122} y1={10} x2={146} y2={10} stroke={DIAG.flowTeal} strokeWidth={2.4} />
        <text x={152} y={13.5}>上行状态</text>
        <line
          x1={204}
          y1={10}
          x2={228}
          y2={10}
          stroke={MESH}
          strokeWidth={2}
          markerStart="url(#oa-mesh-bi)"
          markerEnd="url(#oa-mesh)"
        />
        <text x={234} y={13.5}>Mesh 互联</text>
        <line x1={296} y1={10} x2={320} y2={10} stroke={DIAG.emergency} strokeWidth={2.2} strokeDasharray="5 4" />
        <text x={326} y={13.5}>紧急直达</text>
        <text x={960} y={13.5} textAnchor="end" fill={DIAG.lineGray} fontSize={10}>
          点击模块可进入对应层级
        </text>
      </g>

      {/* ══ 云侧 ═══════════════════════════════════════════════ */}
      <LayerFrame x={40} y={34} w={920} h={196} fill={DIAG.cloudFill} line={DIAG.cloudLine} title="云侧" en="CLOUD TIER" />
      <CloudIcon x={64} y={88} />

      {[
        { x: 124, label: '集群决策', to: '/cloud/decision' },
        { x: 318, label: '数据收集', to: '/cloud/overview' },
        { x: 512, label: '状态检测与历史回溯', to: '/cloud/monitor' },
        { x: 706, label: '全生命周期数据管理', to: '/cloud/lifecycle' },
      ].map((m) => (
        <Module
          key={m.label}
          x={m.x}
          y={64}
          w={170}
          h={58}
          grad="oa-g-cloud"
          line={DIAG.cloudLine}
          label={m.label}
          onClick={() => navigate(m.to)}
        />
      ))}

      {/* 云侧层内：数据收集 → 集群决策 / 状态检测 → 全生命周期 */}
      <path d="M316 93 L296 93" fill="none" stroke={DIAG.lineGray} strokeWidth={1.8} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M488 93 L510 93" fill="none" stroke={DIAG.lineGray} strokeWidth={1.8} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M682 93 L704 93" fill="none" stroke={DIAG.lineGray} strokeWidth={1.8} markerEnd="url(#oa-gray)" className="flow-edge" />

      {/* 数据中心（船形图标） */}
      <ShipIcon x={404} y={150} />
      <text x={430} y={214} textAnchor="middle" fill={DIAG.cloudLine} fontFamily={FONT_BODY} fontSize={12} fontWeight={700}>
        数据中心
      </text>
      {/* 数据中心 → 集群决策（向上汇入） */}
      <path
        d="M425 158 L425 134 L209 134 L209 126"
        fill="none"
        stroke={DIAG.lineGray}
        strokeWidth={1.8}
        markerEnd="url(#oa-gray)"
        className="flow-edge"
      />
      {/* 全生命周期数据管理 → 数据中心（向下归档） */}
      <path
        d="M791 126 L791 174 L455 174"
        fill="none"
        stroke={DIAG.lineGray}
        strokeWidth={1.8}
        markerEnd="url(#oa-gray)"
        className="flow-edge"
      />

      {/* ── 云边协同 ──────────────────────────────────────────── */}
      <Band y={230} h={66} />
      <path d="M424 234 L424 292" fill="none" stroke={DIAG.flowBlue} strokeWidth={2.2} markerEnd="url(#oa-blue)" className="flow-edge" />
      <path d="M436 234 L436 292" fill="none" stroke={DIAG.flowBlue} strokeWidth={2.2} markerEnd="url(#oa-blue)" className="flow-edge" />
      <path d="M564 292 L564 234" fill="none" stroke={DIAG.flowTeal} strokeWidth={2.2} markerEnd="url(#oa-teal)" className="flow-edge" />
      <path d="M576 292 L576 234" fill="none" stroke={DIAG.flowTeal} strokeWidth={2.2} markerEnd="url(#oa-teal)" className="flow-edge" />
      <text x={406} y={254} textAnchor="end" fill={DIAG.flowBlue} fontFamily={FONT_BODY} fontSize={10.5}>
        全局任务、航迹与重规划
      </text>
      <text x={594} y={254} fill={DIAG.flowTeal} fontFamily={FONT_BODY} fontSize={10.5}>
        集群状态、进度与故障
      </text>
      <SwitchIcon cx={500} y={238} />
      <text x={500} y={284} textAnchor="middle" fill={DIAG.flowBlue} fontFamily={FONT_DISPLAY} fontSize={13} fontWeight={700}>
        云边协同
      </text>

      {/* ══ 边侧 ═══════════════════════════════════════════════ */}
      <LayerFrame x={40} y={296} w={920} h={272} fill={DIAG.edgeFill} line={DIAG.edgeLine} title="边侧" en="EDGE TIER" />
      <MonitorIcon x={64} y={346} />

      {[
        { x: 124, label: '任务管理', to: '/edge/overview' },
        { x: 318, label: '多艇状态汇聚', to: '/edge/overview' },
        { x: 512, label: '局部规划与在线重构', to: '/edge/1' },
        { x: 706, label: '边缘自治与应急处理', to: '/edge/2' },
      ].map((m) => (
        <Module
          key={m.label}
          x={m.x}
          y={326}
          w={170}
          h={58}
          grad="oa-g-edge"
          line={DIAG.edgeLine}
          label={m.label}
          onClick={() => navigate(m.to)}
        />
      ))}

      {/* 边侧层内：汇聚 → 任务管理 / 汇聚 → 局部规划 / 自治 → 局部规划 */}
      <path d="M316 355 L296 355" fill="none" stroke={DIAG.lineGray} strokeWidth={1.8} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M488 355 L510 355" fill="none" stroke={DIAG.lineGray} strokeWidth={1.8} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M706 355 L684 355" fill="none" stroke={DIAG.lineGray} strokeWidth={1.8} markerEnd="url(#oa-gray)" className="flow-edge" />

      {/* 实时数据库缓存 */}
      <Cylinder cx={500} top={414} w={300} h={40} ry={10} grad="oa-g-cyl-amber" line={DIAG.edgeLine} label="实时数据库缓存" />
      <path d="M403 388 L403 410" fill="none" stroke={DIAG.flowTeal} strokeWidth={1.8} markerStart="url(#oa-teal-bi)" markerEnd="url(#oa-teal)" className="flow-edge" />
      <path d="M597 388 L597 410" fill="none" stroke={DIAG.flowTeal} strokeWidth={1.8} markerStart="url(#oa-teal-bi)" markerEnd="url(#oa-teal)" className="flow-edge" />

      {/* 无人艇排 + Mesh 互联 */}
      {[
        { cx: 230, label: '无人艇 1' },
        { cx: 500, label: '无人艇 2' },
        { cx: 770, label: '无人艇 N' },
      ].map((b) => (
        <BoatChip key={b.label} cx={b.cx} top={498} label={b.label} onClick={() => navigate('/terminal/overview')} />
      ))}
      <path d="M230 486 L430 458" fill="none" stroke={MESH} strokeWidth={1.7} markerStart="url(#oa-mesh-bi)" markerEnd="url(#oa-mesh)" className="flow-edge" />
      <path d="M500 486 L500 458" fill="none" stroke={MESH} strokeWidth={1.7} markerStart="url(#oa-mesh-bi)" markerEnd="url(#oa-mesh)" className="flow-edge" />
      <path d="M770 486 L570 458" fill="none" stroke={MESH} strokeWidth={1.7} markerStart="url(#oa-mesh-bi)" markerEnd="url(#oa-mesh)" className="flow-edge" />
      <text x={316} y={464} fill={MESH} fontFamily={FONT_MONO} fontSize={10} fontStyle="italic">Mesh</text>
      <text x={512} y={472} fill={MESH} fontFamily={FONT_MONO} fontSize={10} fontStyle="italic">Mesh</text>
      <text x={684} y={464} fill={MESH} fontFamily={FONT_MONO} fontSize={10} fontStyle="italic">Mesh</text>

      {/* ── 数据收发 ──────────────────────────────────────────── */}
      <Band y={568} h={64} />
      <path d="M424 572 L424 628" fill="none" stroke={DIAG.flowBlue} strokeWidth={2.2} markerEnd="url(#oa-blue)" className="flow-edge" />
      <path d="M436 572 L436 628" fill="none" stroke={DIAG.flowBlue} strokeWidth={2.2} markerEnd="url(#oa-blue)" className="flow-edge" />
      <path d="M564 628 L564 572" fill="none" stroke={DIAG.flowTeal} strokeWidth={2.2} markerEnd="url(#oa-teal)" className="flow-edge" />
      <path d="M576 628 L576 572" fill="none" stroke={DIAG.flowTeal} strokeWidth={2.2} markerEnd="url(#oa-teal)" className="flow-edge" />
      <text x={406} y={592} textAnchor="end" fill={DIAG.flowBlue} fontFamily={FONT_BODY} fontSize={10.5}>
        任务指令、局部航迹与编队
      </text>
      <text x={594} y={592} fill={DIAG.flowTeal} fontFamily={FONT_BODY} fontSize={10.5}>
        运行、健康、通信与任务反馈
      </text>
      <UpDownIcon cx={500} y={576} />
      <text x={500} y={622} textAnchor="middle" fill={DIAG.flowBlue} fontFamily={FONT_DISPLAY} fontSize={13} fontWeight={700}>
        数据收发
      </text>

      {/* ══ 端侧 ═══════════════════════════════════════════════ */}
      <LayerFrame x={40} y={632} w={920} h={256} fill={DIAG.endFill} line={DIAG.endLine} title="端侧" en="TERMINAL TIER" />

      {/* 无人艇子框 */}
      <rect x={190} y={650} width={620} height={146} rx={12} fill="#ffffff70" stroke={DIAG.endLine} strokeWidth={1.5} />
      <text x={206} y={672} fill={DIAG.endLine} fontFamily={FONT_DISPLAY} fontSize={12} fontWeight={700}>
        无人艇
      </text>

      {/* 全国产域控制器（圆柱） */}
      <Cylinder cx={330} top={682} w={170} h={34} ry={9} grad="oa-g-cyl-green" line={DIAG.endLine} label="全国产域控制器" fontSize={12} />

      {/* 以太网交换机（立方体） */}
      <SwitchCube cx={505} cy={700} />
      <text x={520} y={688} fill={DIAG.text} fontFamily={FONT_BODY} fontSize={9.5} fontWeight={600}>
        以太网交换机
      </text>

      {/* 预测与健康状态管理域（虚线波浪底文档，挂交换机右侧） */}
      <DocShape
        x={640}
        y={680}
        w={150}
        h={40}
        grad="oa-g-end"
        line={DIAG.endLine}
        label="预测与健康状态管理域"
        fontSize={11}
        dashed
        onClick={() => navigate('/terminal/overview')}
      />

      {/* 域控制器 → 交换机 → 预测与健康状态管理域 */}
      <path d="M415 700 L490 700" fill="none" stroke={DIAG.lineGray} strokeWidth={1.7} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M520 700 L636 700" fill="none" stroke={DIAG.lineGray} strokeWidth={1.7} markerEnd="url(#oa-gray)" className="flow-edge" />

      {/* 四域（波浪底文档） */}
      {[
        { x: 262, label: '感知域' },
        { x: 386, label: '运动控制域' },
        { x: 510, label: '机舱域' },
        { x: 634, label: '通信域' },
      ].map((d) => (
        <DocShape
          key={d.label}
          x={d.x}
          y={740}
          w={104}
          h={44}
          grad="oa-g-end"
          line={DIAG.endLine}
          label={d.label}
          labelStrong
          onClick={() => navigate('/terminal/overview')}
        />
      ))}
      {/* 交换机扇出 → 四域 */}
      <path d="M505 713 L314 738" fill="none" stroke={DIAG.lineGray} strokeWidth={1.5} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M505 713 L438 738" fill="none" stroke={DIAG.lineGray} strokeWidth={1.5} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M505 713 L562 738" fill="none" stroke={DIAG.lineGray} strokeWidth={1.5} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M505 713 L686 738" fill="none" stroke={DIAG.lineGray} strokeWidth={1.5} markerEnd="url(#oa-gray)" className="flow-edge" />

      {/* 左侧外部：相机数据 → 感知域 */}
      <DataBox x={64} y={742} w={96} h={40} label="相机数据" />
      <path d="M164 762 L258 762" fill="none" stroke={DIAG.lineGray} strokeWidth={1.7} markerEnd="url(#oa-gray)" className="flow-edge" />

      {/* 右侧外部：通信数据 ↔HTTP↔ 通信域 */}
      <DataBox x={840} y={742} w={96} h={40} label="通信数据" />
      <path d="M742 762 L836 762" fill="none" stroke={DIAG.lineGray} strokeWidth={1.7} markerStart="url(#oa-gray-bi)" markerEnd="url(#oa-gray)" className="flow-edge" />
      <text x={776} y={754} fill={DIAG.lineGray} fontFamily={FONT_MONO} fontSize={10}>HTTP</text>

      {/* 底部数据源一排 */}
      {[
        { x: 81, label: 'RTK数据' },
        { x: 223, label: 'IMU数据' },
        { x: 365, label: '激光雷达数据' },
        { x: 507, label: '推进器数据' },
        { x: 649, label: '电量数据' },
        { x: 791, label: '温度数据' },
      ].map((s) => (
        <DataBox key={s.label} x={s.x} y={822} w={128} h={34} label={s.label} fontSize={11.5} />
      ))}
      {/* 传感器/机舱数据汇入对应域 */}
      <path d="M160 820 L280 790" fill="none" stroke={DIAG.lineGray} strokeWidth={1.5} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M287 820 L316 790" fill="none" stroke={DIAG.lineGray} strokeWidth={1.5} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M429 820 L438 790" fill="none" stroke={DIAG.flowBlue} strokeWidth={1.5} markerEnd="url(#oa-blue)" className="flow-edge" />
      <path d="M555 820 L470 790" fill="none" stroke={DIAG.lineGray} strokeWidth={1.5} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M690 820 L578 790" fill="none" stroke={DIAG.lineGray} strokeWidth={1.5} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M840 820 L606 790" fill="none" stroke={DIAG.lineGray} strokeWidth={1.5} markerEnd="url(#oa-gray)" className="flow-edge" />
      <text x={178} y={812} fill={DIAG.lineGray} fontFamily={FONT_MONO} fontSize={9.5}>USB</text>
      <text x={281} y={812} fill={DIAG.lineGray} fontFamily={FONT_MONO} fontSize={9.5}>USB</text>
      <text x={450} y={812} fill={DIAG.flowBlue} fontFamily={FONT_MONO} fontSize={9.5}>HTTP</text>
      <text x={520} y={812} fill={DIAG.lineGray} fontFamily={FONT_MONO} fontSize={9.5}>USB</text>
      <text x={640} y={812} fill={DIAG.lineGray} fontFamily={FONT_MONO} fontSize={9.5}>USB</text>

      {/* ── 紧急接管：云侧直达端侧 ────────────────────────────── */}
      <path
        d="M958 112 C 992 260, 992 600, 960 688"
        fill="none"
        stroke={DIAG.emergency}
        strokeWidth={2.2}
        strokeDasharray="7 5"
        markerEnd="url(#oa-em)"
        className="flow-edge"
      />
      <text
        x={940}
        y={348}
        transform="rotate(90 940 348)"
        fill={DIAG.emergency}
        fontFamily={FONT_BODY}
        fontSize={11}
        fontWeight={700}
      >
        紧急接管 · 云侧直达端侧
      </text>
    </svg>
  )
}

/* ── 层外框 ─────────────────────────────────────────────────── */
function LayerFrame({
  x,
  y,
  w,
  h,
  fill,
  line,
  title,
  en,
}: {
  x: number
  y: number
  w: number
  h: number
  fill: string
  line: string
  title: string
  en: string
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={`${fill}55`} stroke={line} strokeWidth={2} />
      <text x={x + 24} y={y + 36} fill={line} fontFamily={FONT_DISPLAY} fontSize={22} fontWeight={700}>
        {title}
      </text>
      <text
        x={x + w - 24}
        y={y + 30}
        textAnchor="end"
        fill={`${line}B3`}
        fontFamily={FONT_MONO}
        fontSize={10}
        letterSpacing={2.5}
      >
        {en}
      </text>
    </g>
  )
}

/* ── 模块卡片（可点击） ─────────────────────────────────────── */
function Module({
  x,
  y,
  w,
  h,
  grad,
  line,
  label,
  onClick,
}: {
  x: number
  y: number
  w: number
  h: number
  grad: string
  line: string
  label: string
  onClick?: () => void
}) {
  return (
    <g onClick={onClick} className={onClick ? `cursor-pointer ${HOVER_LIFT}` : undefined}>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={`url(#${grad})`} stroke={line} strokeWidth={1.8} />
      <rect x={x + 5} y={y + 4} width={w - 10} height={1.2} rx={0.6} fill="#ffffff" opacity={0.85} />
      <text
        x={x + w / 2}
        y={y + h / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={DIAG.text}
        fontFamily={FONT_BODY}
        fontSize={13}
        fontWeight={600}
      >
        {label}
      </text>
    </g>
  )
}

/* ── 圆柱体（数据库 / 域控制器） ────────────────────────────── */
function Cylinder({
  cx,
  top,
  w,
  h,
  ry,
  grad,
  line,
  label,
  fontSize = 12.5,
  onClick,
}: {
  cx: number
  top: number
  w: number
  h: number
  ry: number
  grad: string
  line: string
  label: string
  fontSize?: number
  onClick?: () => void
}) {
  const x = cx - w / 2
  const bottom = top + h
  return (
    <g onClick={onClick} className={onClick ? `cursor-pointer ${HOVER_LIFT}` : undefined}>
      <path
        d={`M ${x} ${top + ry} L ${x} ${bottom - ry} A ${w / 2} ${ry} 0 0 0 ${x + w} ${bottom - ry} L ${x + w} ${top + ry}`}
        fill={`url(#${grad})`}
        stroke={line}
        strokeWidth={1.8}
      />
      <ellipse cx={cx} cy={top + ry} rx={w / 2} ry={ry} fill={`url(#${grad})`} stroke={line} strokeWidth={1.8} />
      <ellipse cx={cx} cy={top + ry} rx={w / 2 - 7} ry={Math.max(2.5, ry - 3)} fill="none" stroke="#ffffff" strokeWidth={1} opacity={0.7} />
      <text
        x={cx}
        y={top + h / 2 + fontSize * 0.36}
        textAnchor="middle"
        fill={line}
        fontFamily={FONT_BODY}
        fontSize={fontSize}
        fontWeight={700}
      >
        {label}
      </text>
    </g>
  )
}

/* ── 等轴测立方体（以太网交换机） ───────────────────────────── */
function SwitchCube({ cx, cy }: { cx: number; cy: number }) {
  const s = 11
  const v = 15
  const top = `${cx},${cy - 16} ${cx + s},${cy - 10} ${cx},${cy - 4} ${cx - s},${cy - 10}`
  const left = `${cx - s},${cy - 10} ${cx},${cy - 4} ${cx},${cy - 4 + v} ${cx - s},${cy - 10 + v}`
  const right = `${cx},${cy - 4} ${cx + s},${cy - 10} ${cx + s},${cy - 10 + v} ${cx},${cy - 4 + v}`
  return (
    <g stroke={DIAG.endLine} strokeWidth={1.5} strokeLinejoin="round">
      <polygon points={left} fill="#D9E9D5" />
      <polygon points={right} fill="#C3DEC0" />
      <polygon points={top} fill="#F4FAF2" />
      {/* 前面板网口 */}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={cx - 6.4 + i * 4.6}
          y={cy + 2.5}
          width={3}
          height={4.4}
          rx={0.5}
          fill={DIAG.endLine}
          stroke="none"
          opacity={0.7}
        />
      ))}
    </g>
  )
}

/* ── 波浪底文档形（域） ─────────────────────────────────────── */
function docPath(x: number, y: number, w: number, h: number, amp = 7) {
  const yb = y + h - amp * 1.4
  return [
    `M ${x} ${y}`,
    `L ${x + w} ${y}`,
    `L ${x + w} ${yb}`,
    `Q ${x + w * 0.75} ${yb + amp * 1.6} ${x + w * 0.5} ${yb}`,
    `Q ${x + w * 0.25} ${yb - amp * 1.6} ${x} ${yb}`,
    'Z',
  ].join(' ')
}

function DocShape({
  x,
  y,
  w,
  h,
  grad,
  line,
  label,
  fontSize = 12.5,
  dashed = false,
  labelStrong = false,
  onClick,
}: {
  x: number
  y: number
  w: number
  h: number
  grad: string
  line: string
  label: string
  fontSize?: number
  dashed?: boolean
  labelStrong?: boolean
  onClick?: () => void
}) {
  return (
    <g onClick={onClick} className={onClick ? `cursor-pointer ${HOVER_LIFT}` : undefined}>
      <path
        d={docPath(x, y, w, h)}
        fill={`url(#${grad})`}
        stroke={line}
        strokeWidth={1.8}
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      <text
        x={x + w / 2}
        y={y + (h - 6) / 2 + fontSize * 0.34}
        textAnchor="middle"
        fill={labelStrong ? line : DIAG.text}
        fontFamily={FONT_BODY}
        fontSize={fontSize}
        fontWeight={labelStrong ? 700 : 600}
      >
        {label}
      </text>
    </g>
  )
}

/* ── 无人艇 ─────────────────────────────────────────────────── */
function BoatChip({
  cx,
  top,
  label,
  onClick,
}: {
  cx: number
  top: number
  label: string
  onClick?: () => void
}) {
  return (
    <g onClick={onClick} className={onClick ? `cursor-pointer ${HOVER_LIFT}` : undefined}>
      <rect x={cx - 16} y={top - 10} width={32} height={10} rx={2} fill="#EFF7EE" stroke={DIAG.endLine} strokeWidth={1.5} />
      <polygon
        points={`${cx - 62},${top} ${cx + 62},${top} ${cx + 48},${top + 34} ${cx - 48},${top + 34}`}
        fill="url(#oa-g-end)"
        stroke={DIAG.endLine}
        strokeWidth={1.8}
      />
      <text
        x={cx}
        y={top + 21}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={DIAG.text}
        fontFamily={FONT_BODY}
        fontSize={12}
        fontWeight={600}
      >
        {label}
      </text>
    </g>
  )
}

/* ── 外部数据框 ─────────────────────────────────────────────── */
function DataBox({
  x,
  y,
  w,
  h,
  label,
  fontSize = 12,
}: {
  x: number
  y: number
  w: number
  h: number
  label: string
  fontSize?: number
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#F7FAFC" stroke={DIAG.lineGray} strokeWidth={1.6} />
      <text
        x={x + w / 2}
        y={y + h / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={DIAG.text}
        fontFamily={FONT_BODY}
        fontSize={fontSize}
        fontWeight={600}
      >
        {label}
      </text>
    </g>
  )
}

/* ── 层间连接带 ─────────────────────────────────────────────── */
function Band({ y, h }: { y: number; h: number }) {
  return (
    <g>
      <rect x={40} y={y} width={920} height={h} fill="#ffffff4d" />
      <rect x={40} y={y} width={920} height={h} fill="url(#oa-grid)" />
      <line x1={40} y1={y} x2={960} y2={y} stroke={DIAG.lineGray} strokeOpacity={0.3} strokeWidth={1} />
      <line x1={40} y1={y + h} x2={960} y2={y + h} stroke={DIAG.lineGray} strokeOpacity={0.3} strokeWidth={1} />
    </g>
  )
}

/* ── 图标 ───────────────────────────────────────────────────── */
function CloudIcon({ x, y }: { x: number; y: number }) {
  return (
    <g
      transform={`translate(${x}, ${y}) scale(1.7)`}
      fill="none"
      stroke={DIAG.cloudLine}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#F4FAFF" />
    </g>
  )
}

function MonitorIcon({ x, y }: { x: number; y: number }) {
  return (
    <g
      transform={`translate(${x}, ${y}) scale(1.55)`}
      fill="none"
      stroke={DIAG.edgeLine}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" fill="#FFFDF7" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </g>
  )
}

function ShipIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(2.2)`} stroke={DIAG.cloudLine} strokeWidth={1} strokeLinejoin="round">
      <path d="M2 14 L22 14 L19 19 L5 19 Z" fill="url(#oa-g-ship)" />
      <path d="M5 14 L5 11.5 L19 11.5 L19 14" fill="url(#oa-g-ship)" />
      <rect x="8.5" y="7.5" width="5" height="4" fill="url(#oa-g-ship)" />
      <rect x="14.5" y="9.5" width="2.5" height="2" fill="url(#oa-g-ship)" />
      <line x1="11" y1="7.5" x2="11" y2="4.5" fill="none" strokeLinecap="round" />
      <line x1="11" y1="5" x2="13.5" y2="6.2" fill="none" strokeLinecap="round" />
    </g>
  )
}

function SwitchIcon({ cx, y }: { cx: number; y: number }) {
  return (
    <g>
      <line x1={cx - 18} y1={y} x2={cx - 18} y2={y - 5} stroke={DIAG.flowBlue} strokeWidth={1.4} />
      <line x1={cx + 18} y1={y} x2={cx + 18} y2={y - 5} stroke={DIAG.flowBlue} strokeWidth={1.4} />
      <line x1={cx - 18} y1={y + 26} x2={cx - 18} y2={y + 31} stroke={DIAG.flowBlue} strokeWidth={1.4} />
      <line x1={cx + 18} y1={y + 26} x2={cx + 18} y2={y + 31} stroke={DIAG.flowBlue} strokeWidth={1.4} />
      <rect x={cx - 28} y={y} width={56} height={26} rx={7} fill="#F2F8FE" stroke={DIAG.flowBlue} strokeWidth={1.6} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={cx - 21 + i * 12} y={y + 8} width={8} height={6} rx={1} fill={DIAG.flowBlue} opacity={0.75} />
      ))}
      <circle cx={cx - 22} cy={y + 19.5} r={1.4} fill={DIAG.flowTeal} />
      <circle cx={cx - 16} cy={y + 19.5} r={1.4} fill={DIAG.flowTeal} opacity={0.5} />
    </g>
  )
}

function UpDownIcon({ cx, y }: { cx: number; y: number }) {
  return (
    <g>
      <rect x={cx - 19} y={y} width={38} height={26} rx={7} fill="#F2F8FE" stroke={DIAG.flowBlue} strokeWidth={1.6} />
      <path
        d={`M ${cx - 7} ${y + 5} L ${cx - 7} ${y + 19} M ${cx - 10} ${y + 16} L ${cx - 7} ${y + 20} L ${cx - 4} ${y + 16}`}
        fill="none"
        stroke={DIAG.flowBlue}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M ${cx + 7} ${y + 21} L ${cx + 7} ${y + 7} M ${cx + 4} ${y + 10} L ${cx + 7} ${y + 6} L ${cx + 10} ${y + 10}`}
        fill="none"
        stroke={DIAG.flowTeal}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}
