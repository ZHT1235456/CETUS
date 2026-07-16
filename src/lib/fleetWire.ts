import { FLEET } from '@/config/fleet'
import type {
  FleetFrame,
  FleetMessage,
  USVId,
  WireFleetDatagramV1,
  WireFleetUnitV1,
} from '@/types/usv'

export const DEFAULT_FLEET_HOST = '127.0.0.1'
export const DEFAULT_FLEET_PORT = 5005
export const FLEET_ENDPOINT_STORAGE_KEY = 'cetus.fleetWsEndpoint'

const ENV_FLEET_WS_URL = import.meta.env.VITE_FLEET_WS_URL as string | undefined

export const DEFAULT_FLEET_WS_URL =
  ENV_FLEET_WS_URL ?? `ws://${DEFAULT_FLEET_HOST}:${DEFAULT_FLEET_PORT}`

export interface FleetEndpoint {
  host: string
  port: number
}

export function buildFleetWsUrl(host: string, port: number): string {
  return `ws://${host}:${port}`
}

export function parseFleetWsUrl(url: string): FleetEndpoint | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') return null
    const port = parsed.port
      ? Number(parsed.port)
      : parsed.protocol === 'wss:'
        ? 443
        : 80
    if (!parsed.hostname || !Number.isInteger(port) || port < 1 || port > 65535) return null
    return { host: parsed.hostname, port }
  } catch {
    return null
  }
}

const HOST_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}|localhost|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/

export function normalizeFleetEndpoint(hostRaw: string, portRaw: string | number): FleetEndpoint {
  const host = hostRaw.trim()
  const port = typeof portRaw === 'number' ? portRaw : Number(portRaw.trim())
  if (!HOST_PATTERN.test(host)) {
    throw new Error('请输入有效的 IPv4 或主机名')
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('端口须为 1–65535 的整数')
  }
  return { host, port }
}

export function loadStoredFleetEndpoint(): FleetEndpoint {
  const fromEnv = ENV_FLEET_WS_URL ? parseFleetWsUrl(ENV_FLEET_WS_URL) : null
  try {
    const raw = localStorage.getItem(FLEET_ENDPOINT_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FleetEndpoint>
      if (typeof parsed.host === 'string' && typeof parsed.port === 'number') {
        return normalizeFleetEndpoint(parsed.host, parsed.port)
      }
    }
  } catch {
    // fall through to defaults
  }
  return fromEnv ?? { host: DEFAULT_FLEET_HOST, port: DEFAULT_FLEET_PORT }
}

export function saveStoredFleetEndpoint(endpoint: FleetEndpoint): void {
  localStorage.setItem(FLEET_ENDPOINT_STORAGE_KEY, JSON.stringify(endpoint))
}

const FLEET_IDS = FLEET.map((unit) => unit.id)

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseUnit(id: USVId, unit: WireFleetUnitV1) {
  const values = [unit.x, unit.y, unit.z, unit.heading, unit.speed, unit.health]
  if (!values.every(isFiniteNumber)) {
    throw new Error(`${id} contains a non-finite number`)
  }
  if (unit.speed < 0) {
    throw new Error(`${id}.speed must be non-negative`)
  }
  if (unit.health < 0 || unit.health > 100) {
    throw new Error(`${id}.health must be between 0 and 100`)
  }
  return {
    id,
    x: unit.x,
    y: unit.y,
    z: unit.z,
    heading: unit.heading,
    speed: unit.speed,
    isFault: Boolean(unit.isFault),
    health: unit.health,
  }
}

/** 将 Python WebSocket V1 完整帧解析为前端 FleetMessage。 */
export function parseFleetWire(raw: string): { wire: WireFleetDatagramV1; message: FleetMessage } {
  const wire = JSON.parse(raw) as WireFleetDatagramV1
  if (wire.version !== 1) {
    throw new Error(`unsupported protocol version ${String(wire.version)}`)
  }
  if (wire.type !== 'fleet') {
    throw new Error("message type must be 'fleet'")
  }
  if (typeof wire.streamId !== 'string' || wire.streamId.length < 1 || wire.streamId.length > 128) {
    throw new Error('streamId must contain 1 to 128 characters')
  }
  if (typeof wire.seq !== 'number' || !Number.isFinite(wire.seq) || wire.seq < 0) {
    throw new Error('seq must be a non-negative finite number')
  }
  if (typeof wire.sentAtMs !== 'number' || !Number.isFinite(wire.sentAtMs)) {
    throw new Error('sentAtMs must be a finite number')
  }
  if (!wire.frame || typeof wire.frame !== 'object') {
    throw new Error('frame must be an object')
  }

  const actualIds = Object.keys(wire.frame).sort()
  const expectedIds = [...FLEET_IDS].sort()
  if (actualIds.length !== expectedIds.length || actualIds.some((id, i) => id !== expectedIds[i])) {
    throw new Error(`frame must contain exactly ${FLEET_IDS.join(', ')}`)
  }

  const frame = {} as FleetFrame
  for (const id of FLEET_IDS) {
    frame[id] = parseUnit(id, wire.frame[id])
  }

  return {
    wire,
    message: {
      type: 'fleet',
      timestamp: wire.sentAtMs,
      frame,
    },
  }
}
