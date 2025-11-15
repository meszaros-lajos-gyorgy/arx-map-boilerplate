import { $, ArxMap, Settings, Vector3 } from 'arx-level-generator'
import { Box3 } from 'three'

export async function loadCastle(settings: Settings) {
  const castle = await ArxMap.fromOriginalLevel(0, settings)

  const box = new Box3(new Vector3(4600, 1600, 8590), new Vector3(4800, 1800, 8750))

  return $(castle.polygons)
    .selectWithinBox(box)
    .copy()
    .selectAll()
    .moveToRoom1()
    .move(new Vector3(1150, -1730, -1770))
    .get()
}
