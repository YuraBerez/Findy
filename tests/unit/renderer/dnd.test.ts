import type { ClientRect, CollisionDetection, DroppableContainer } from '@dnd-kit/core'
import { describe, expect, it } from 'vitest'
import { collisionDetection, COLUMN_PREFIX } from '../../../src/renderer/features/board/dnd'

// Two columns side by side; "applied" holds A, B, C from top to bottom (issue #12)
const rect = (left: number, top: number, width: number, height: number): ClientRect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
})

const RECTS = new Map<string, ClientRect>([
  [COLUMN_PREFIX + 'applied', rect(0, 0, 250, 600)],
  [COLUMN_PREFIX + 'hr_interview', rect(260, 0, 250, 600)],
  ['A', rect(10, 50, 230, 80)],
  ['B', rect(10, 140, 230, 80)],
  ['C', rect(10, 230, 230, 80)],
])

const container = (id: string): DroppableContainer =>
  ({
    id,
    key: id,
    disabled: false,
    node: { current: null },
    rect: { current: RECTS.get(id)! },
    data: {
      current: id.startsWith(COLUMN_PREFIX) ? {} : { sortable: { containerId: 'applied' } },
    },
  }) as unknown as DroppableContainer

type Args = Parameters<CollisionDetection>[0]

/** Drag C; the dragged overlay is at `overlay`, the pointer at `pointer` */
function detect(pointer: { x: number; y: number } | null, overlay: ClientRect): string[] {
  const args = {
    active: { id: 'C' },
    collisionRect: overlay,
    droppableRects: RECTS,
    droppableContainers: [...RECTS.keys()].map(container),
    pointerCoordinates: pointer,
  } as unknown as Args
  return collisionDetection(args).map((hit) => String(hit.id))
}

describe('collisionDetection (FR-020…022, issue #12)', () => {
  it('picks the closest card in the column under the pointer', () => {
    expect(detect({ x: 120, y: 70 }, rect(10, 30, 230, 80))[0]).toBe('A')
  })

  it("lets the dragged card be the target over its own slot ('stay here')", () => {
    expect(detect({ x: 120, y: 270 }, rect(10, 230, 230, 80))[0]).toBe('C')
  })

  it("ignores the dragged card's rectangle when the pointer is known", () => {
    // Pointer in the gap above the columns; the overlay overlaps the HR column
    expect(detect({ x: 120, y: -10 }, rect(300, 50, 230, 80))).toEqual([])
  })

  it('uses the dragged card for a keyboard drag (no pointer)', () => {
    expect(detect(null, rect(270, 20, 230, 80))).toEqual([COLUMN_PREFIX + 'hr_interview'])
  })
})
