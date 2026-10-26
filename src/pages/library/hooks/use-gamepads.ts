import { useSyncExternalStore } from 'react'
import { Gamepad, pickActiveGamepad } from '#@/utils/client/gamepad.ts'

function subscribe(callback) {
  const abortController = new AbortController()
  globalThis.addEventListener('gamepadconnected', callback, { signal: abortController.signal })
  globalThis.addEventListener('gamepaddisconnected', callback, { signal: abortController.signal })
  return () => abortController.abort()
}

const identities = ['id', 'index', 'connected']
function isSameGamepad(gamepad1, gamepad2) {
  if (gamepad1 === gamepad2 || (!gamepad1 && !gamepad2)) {
    return true
  }
  if (gamepad1 && gamepad2) {
    return identities.every((identity) => gamepad1[identity] === gamepad2[identity])
  }
  return false
}

function isSameGamepads(gamepads1, gamepads2) {
  if (gamepads1?.length !== gamepads2?.length) {
    return false
  }
  if (gamepads1 && gamepads2) {
    for (const [i, gamepad1] of gamepads1.entries()) {
      if (!isSameGamepad(gamepad1, gamepads2[i])) {
        return false
      }
    }
    return true
  }
  return false
}

let snapshot: (Gamepad | null)[]
function getSnapshot() {
  try {
    const gamepads = navigator.getGamepads?.()
    if (!isSameGamepads(gamepads, snapshot)) {
      snapshot = gamepads
    }
    return snapshot
  } catch {
    return null
  }
}

function getActiveIndex() {
  return Gamepad.activeIndex
}

export function useGamepads() {
  const gamepads = useSyncExternalStore(subscribe, getSnapshot, () => null)
  const activeIndex = useSyncExternalStore(Gamepad.onActiveIndexChange, getActiveIndex, getActiveIndex)
  const gamepad = pickActiveGamepad(gamepads, activeIndex)
  const connected = Boolean(gamepad)
  return { connected, gamepad, gamepads }
}
