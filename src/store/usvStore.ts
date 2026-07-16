import { create } from 'zustand'
import type {
  FleetFrame,
  FleetMessage,
  ReceiverStatus,
  USVId,
} from '@/types/usv'
import { FLEET } from '@/config/fleet'
import { frameAt } from '@/lib/fleetReplay'

const EMPTY_FRAME = (): FleetFrame => {
  const frame = {} as FleetFrame
  for (const unit of FLEET) {
    frame[unit.id] = {
      id: unit.id,
      x: 0,
      y: 0,
      z: 0,
      heading: 0,
      speed: 0,
      isFault: false,
      health: 100,
    }
  }
  return frame
}

const INITIAL_RECEIVER: ReceiverStatus = {
  state: 'idle',
  bindAddress: '0.0.0.0:5005',
  sender: null,
  lastPacketAtMs: null,
  droppedPackets: 0,
}

interface FleetStore {
  source: 'mock' | 'live'
  hasReceivedLive: boolean
  frame: FleetFrame
  updatedAt: number
  receiver: ReceiverStatus
  receiverError: string | null

  tickMock: (t: number) => void
  ingestLive: (message: FleetMessage) => void
  updateReceiver: (status: ReceiverStatus) => void
  setReceiverError: (message: string | null, fatal?: boolean) => void
}

export const useFleetStore = create<FleetStore>((set) => ({
  source: 'mock',
  hasReceivedLive: false,
  frame: EMPTY_FRAME(),
  updatedAt: 0,
  receiver: INITIAL_RECEIVER,
  receiverError: null,

  tickMock: (t) =>
    set((state) =>
      state.hasReceivedLive
        ? state
        : { frame: frameAt(t), updatedAt: t, source: 'mock' },
    ),
  ingestLive: (message) =>
    set({
      frame: message.frame,
      updatedAt: message.timestamp,
      source: 'live',
      hasReceivedLive: true,
      receiverError: null,
    }),
  updateReceiver: (receiver) => set({ receiver }),
  setReceiverError: (message, fatal = false) =>
    set((state) => ({
      receiverError: message,
      receiver: fatal ? { ...state.receiver, state: 'error' } : state.receiver,
    })),
}))

export const useUnit = (id: USVId) => useFleetStore((state) => state.frame[id])
