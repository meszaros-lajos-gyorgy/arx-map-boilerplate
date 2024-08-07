import { $, ArxMap, HudElements, Polygon, Settings, Vector3 } from 'arx-level-generator'
import { Speed } from 'arx-level-generator/scripting/properties'
import { Box3 } from 'three'

// reads the contents of the .env file
// pass in an optional object to override certain settings
const settings = new Settings()

// ---------------------------------------------

// create a blank map
const map = new ArxMap()

// move to the center of the map, everything will be offset from this point
map.config.offset = new Vector3(6000, 0, 6000)

// move the player a bit higher so that he doesn't sink into the floor
map.player.position.adjustToPlayerHeight()

// enable the addition of custom scripts for the player entity
map.player.withScript()

// adjust the player's speed with scripting to be 1.5 times faster
map.player.script?.properties.push(new Speed(1.5))

// hide the minimap
map.hud.hide(HudElements.Minimap)

// ---------------------------------------------

const level8 = await ArxMap.fromOriginalLevel(8, settings)
const offset = level8.polygons[0].vertices[0].clone().multiplyScalar(-1)
level8.move(offset)

const selection1 = new Box3(new Vector3(0, 0, 0), new Vector3(500, 200, 500))

const polygons1 = $(level8.polygons)
  .selectWithinBox(selection1)
  .copy()
  .selectAll()
  .move(map.config.offset)
  .get()

const selection2 = new Box3(new Vector3(500, -500, 500), new Vector3(800, 200, 1600))

const polygons2 = $(level8.polygons)
  .clearSelection()
  .selectWithinBox(selection2)
  .copy()
  .selectAll()
  .move(map.config.offset)
  .move(new Vector3(-400, 0, 0))
  .get()

const columns: Polygon[] = []

for(let i = 0; i < 5; i++) {
  const column = $(polygons2)
    .selectAll()
    .copy()
    .selectAll()
    .move(new Vector3(400 * i, 0, 0))
    .get()
  columns.push(...column)
}

map.polygons.push(...polygons1, ...polygons2, ...columns)

// ---------------------------------------------

// trigger the calculation of entity ids, rendering of script event handlers and so on...
map.finalize()

// export everything to a format which Arx can understand
await map.saveToDisk(settings)

console.log('done')
