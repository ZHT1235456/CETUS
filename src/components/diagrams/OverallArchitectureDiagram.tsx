import { useNavigate } from 'react-router-dom'
import { DIAG } from './colors'

const FONT_DISPLAY = 'Chakra Petch, sans-serif'
const FONT_BODY = 'Sora, sans-serif'
const FONT_MONO = 'JetBrains Mono, monospace'
const MESH = '#6E87A0'
/** 连接带集线器穿线位置（左二下行蓝 / 右二上行青） */
const HUB_LINE_XS = [458, 476, 524, 542] as const

const HOVER_LIFT =
  'transition-all duration-300 hover:-translate-y-1 hover:[filter:drop-shadow(0_5px_10px_rgba(26,64,110,0.22))]'

type Props = {
  className?: string
}

export function OverallArchitectureDiagram({ className }: Props) {
  const navigate = useNavigate()

  return (
    <svg
      viewBox="0 0 1016 900"
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
        { x: 415, label: '状态检测与历史回溯', to: '/cloud/monitor' },
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

      {/* 数据收集（移至模块行下方，紧邻数据中心与云边协同带） */}
      <Module
        x={330}
        y={160}
        w={170}
        h={58}
        grad="oa-g-cloud"
        line={DIAG.cloudLine}
        label="数据收集"
        onClick={() => navigate('/cloud/overview')}
      />

      {/* 云侧层内：
          a. 数据收集顶边 → 上行左肘 → 集群决策底边
          b. 数据收集顶边 → 竖直向上 → 状态检测底边
          c. 状态检测 → 全生命周期
          d. 全生命周期底边 → 下行左肘 → 数据中心（船）
          e. 数据收集右舷 → 水平向右 → 数据中心（船） */}
      <path d="M400 160 L400 132 L209 132 L209 124" fill="none" stroke={DIAG.lineGray} strokeWidth={1.8} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M470 160 L470 124" fill="none" stroke={DIAG.lineGray} strokeWidth={1.8} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M585 93 L704 93" fill="none" stroke={DIAG.lineGray} strokeWidth={1.8} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M791 122 L791 148 L645 148 L645 181" fill="none" stroke={DIAG.lineGray} strokeWidth={1.8} markerEnd="url(#oa-gray)" className="flow-edge" />
      <path d="M500 189 L613 189" fill="none" stroke={DIAG.lineGray} strokeWidth={1.8} markerEnd="url(#oa-gray)" className="flow-edge" />

      {/* 数据中心（船形图标，置于数据收集右侧） */}
      <ShipIcon x={606} y={162} />
      <text x={632} y={220} textAnchor="middle" fill={DIAG.cloudLine} fontFamily={FONT_BODY} fontSize={12} fontWeight={700}>
        数据中心
      </text>

      {/* ── 云边协同 ──────────────────────────────────────────── */}
      <Band y={230} h={66} />
      {/* g/h. 珠链通断示意（无箭头）：横杠居中，上 3 珠接云侧底边、下 2 珠接边侧顶边 */}
      <BeadHub cx={500} topY={230} botY={296} />
      {/* i. 上行状态双线（青色）：边侧顶边 → 竖直向上 → 箭头入数据收集底边 */}
      <path d="M380 296 L380 219" fill="none" stroke={DIAG.flowTeal} strokeWidth={2.2} markerEnd="url(#oa-teal)" className="flow-edge" />
      <path d="M405 296 L405 219" fill="none" stroke={DIAG.flowTeal} strokeWidth={2.2} markerEnd="url(#oa-teal)" className="flow-edge" />
      {/* j. 下行任务双线（蓝色）：云侧底边 → 竖直向下 → 边侧顶边 */}
      <path d="M595 230 L595 296" fill="none" stroke={DIAG.flowBlue} strokeWidth={2.2} markerEnd="url(#oa-blue)" className="flow-edge" />
      <path d="M620 230 L620 296" fill="none" stroke={DIAG.flowBlue} strokeWidth={2.2} markerEnd="url(#oa-blue)" className="flow-edge" />
      <text x={640} y={267} fill={DIAG.flowBlue} fontFamily={FONT_DISPLAY} fontSize={13} fontWeight={700}>
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

      {/* l. 任务管理底边靠右 → 向下入走廊(y=399，模块行底与缓存顶之间)→ 水平向右 → 向上入局部规划底边（任务约束） */}
      <path d="M270 384 L270 399 L620 399 L620 386" fill="none" stroke={DIAG.flowBlue} strokeWidth={1.8} markerEnd="url(#oa-blue)" className="flow-edge" />
      <text x={445} y={411} textAnchor="middle" fill={DIAG.flowBlue} fontFamily={FONT_BODY} fontSize={10}>任务约束</text>

      {/* 实时数据库缓存 */}
      <Cylinder cx={500} top={414} w={300} h={40} ry={10} grad="oa-g-cyl-amber" line={DIAG.edgeLine} label="实时数据库缓存" />
      {/* m. 局部规划与在线重构底边 → 竖直向下入缓存顶面（仅此一条入缓存） */}
      <path d="M597 384 L597 413" fill="none" stroke={DIAG.flowTeal} strokeWidth={1.8} markerEnd="url(#oa-teal)" className="flow-edge" />

      {/* 无人艇排 + Mesh 互联 */}
      {[
        { cx: 230, label: '无人艇 1' },
        { cx: 500, label: '无人艇 2' },
        { cx: 770, label: '无人艇 N' },
      ].map((b) => (
        <BoatChip key={b.label} cx={b.cx} top={498} label={b.label} onClick={() => navigate('/terminal/overview')} />
      ))}
      {/* n. 缓存底面 → 3 条 Mesh 双向肘形线 → 三艇顶边（左弯 / 中直 / 右弯） */}
      <path d="M400 454 L400 472 L230 472 L230 486" fill="none" stroke={MESH} strokeWidth={1.7} markerStart="url(#oa-mesh-bi)" markerEnd="url(#oa-mesh)" className="flow-edge" />
      <path d="M500 454 L500 486" fill="none" stroke={MESH} strokeWidth={1.7} markerStart="url(#oa-mesh-bi)" markerEnd="url(#oa-mesh)" className="flow-edge" />
      <path d="M600 454 L600 472 L770 472 L770 486" fill="none" stroke={MESH} strokeWidth={1.7} markerStart="url(#oa-mesh-bi)" markerEnd="url(#oa-mesh)" className="flow-edge" />
      <text x={300} y={466} fill={MESH} fontFamily={FONT_MONO} fontSize={10} fontStyle="italic">Mesh</text>
      <text x={514} y={472} fill={MESH} fontFamily={FONT_MONO} fontSize={10} fontStyle="italic">Mesh</text>
      <text x={700} y={466} fill={MESH} fontFamily={FONT_MONO} fontSize={10} fontStyle="italic">Mesh</text>

      {/* ── 数据收发 ──────────────────────────────────────────── */}
      <Band y={568} h={64} />
      {/* 连线自边侧层框底边(y=568)出发，穿过集线器图标，精确落在端侧层框顶边(y=632) */}
      <path d="M458 568 L458 632" fill="none" stroke={DIAG.flowBlue} strokeWidth={2.2} markerEnd="url(#oa-blue)" className="flow-edge" />
      <path d="M476 568 L476 632" fill="none" stroke={DIAG.flowBlue} strokeWidth={2.2} markerEnd="url(#oa-blue)" className="flow-edge" />
      <path d="M524 632 L524 568" fill="none" stroke={DIAG.flowTeal} strokeWidth={2.2} markerEnd="url(#oa-teal)" className="flow-edge" />
      <path d="M542 632 L542 568" fill="none" stroke={DIAG.flowTeal} strokeWidth={2.2} markerEnd="url(#oa-teal)" className="flow-edge" />
      <HubIcon cx={500} cy={600} />
      <text x={446} y={587} textAnchor="end" fill={DIAG.flowBlue} fontFamily={FONT_BODY} fontSize={10.5}>
        任务指令、局部航迹与编队
      </text>
      <text x={566} y={604} fill={DIAG.flowBlue} fontFamily={FONT_DISPLAY} fontSize={13} fontWeight={700}>
        数据收发
      </text>
      <text x={566} y={623} fill={DIAG.flowTeal} fontFamily={FONT_BODY} fontSize={10.5}>
        运行、健康、通信与任务反馈
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
        x={998}
        y={330}
        transform="rotate(90 998 330)"
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

/* ── 珠链集线器（链路通断示意：横杠 + 上 3 珠 / 下 2 珠，无箭头） ── */
function BeadHub({ cx, topY, botY }: { cx: number; topY: number; botY: number }) {
  const cy = (topY + botY) / 2
  const barY = cy - 6
  const topXs = [cx - 35, cx, cx + 35]
  const botXs = [cx - 15, cx + 15]
  return (
    <g>
      {topXs.map((x, i) => (
        <g key={`t${x}`}>
          <line x1={x} y1={topY} x2={x} y2={barY} stroke={DIAG.flowBlue} strokeWidth={1.8} />
          <circle
            cx={x}
            cy={topY + (barY - topY) * 0.55}
            r={3.2}
            fill={DIAG.flowBlue}
            stroke="#ffffff"
            strokeWidth={1}
            style={{ animation: 'pulse-soft 2.4s ease-in-out infinite', animationDelay: `${i * 0.35}s` }}
          />
        </g>
      ))}
      {botXs.map((x, i) => (
        <g key={`b${x}`}>
          <line x1={x} y1={barY + 12} x2={x} y2={botY} stroke={DIAG.flowTeal} strokeWidth={1.8} />
          <circle
            cx={x}
            cy={barY + 12 + (botY - barY - 12) * 0.45}
            r={3.2}
            fill={DIAG.flowTeal}
            stroke="#ffffff"
            strokeWidth={1}
            style={{ animation: 'pulse-soft 2.4s ease-in-out infinite', animationDelay: `${1.1 + i * 0.35}s` }}
          />
        </g>
      ))}
      <rect x={cx - 55} y={barY} width={110} height={12} rx={4} fill="#F2F8FE" stroke={DIAG.flowBlue} strokeWidth={1.6} />
    </g>
  )
}

/* ── 集线器图标（横杠 + 网口小方块 + 上下线桩节点） ──────────── */
function HubIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect
        x={cx - 50}
        y={cy - 7}
        width={100}
        height={14}
        rx={4}
        fill="#F2F8FE"
        stroke={DIAG.flowBlue}
        strokeWidth={1.6}
      />
      {[-32, -11, 11, 32].map((dx) => (
        <rect
          key={dx}
          x={cx + dx - 3.5}
          y={cy - 3.5}
          width={7}
          height={7}
          rx={1.2}
          fill={DIAG.flowBlue}
          opacity={0.72}
        />
      ))}
      {HUB_LINE_XS.map((x) => (
        <circle
          key={`t${x}`}
          cx={x}
          cy={cy - 7}
          r={2.6}
          fill={x < cx ? DIAG.flowBlue : DIAG.flowTeal}
          stroke="#ffffff"
          strokeWidth={0.8}
        />
      ))}
      {HUB_LINE_XS.map((x) => (
        <circle
          key={`b${x}`}
          cx={x}
          cy={cy + 7}
          r={2.6}
          fill={x < cx ? DIAG.flowBlue : DIAG.flowTeal}
          stroke="#ffffff"
          strokeWidth={0.8}
        />
      ))}
    </g>
  )
}

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
