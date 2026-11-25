import { SetTile, type TileContext } from './SetTile'
import type { SetItem } from '@/lib/api/types'

interface SetTilesProps {
  sets: SetItem[]
  context: TileContext
  view?: 'grid' | 'list' | 'auto'
  columns?: 4 | 5
  eagerCount?: number
}

/** Набори сіткою карток або списком рядків; `auto` — сітка на комп'ютері, список на телефоні. */
export function SetTiles({ sets, context, view = 'auto', columns = 4, eagerCount = 0 }: SetTilesProps) {
  return (
    <div className={`tiles tiles--${view} tiles--c${columns}`}>
      {sets.map((set, index) => (
        <SetTile key={set.id} set={set} context={context} eager={index < eagerCount} />
      ))}
    </div>
  )
}
