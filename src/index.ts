import { ArxPolygonFlags } from 'arx-convert/types'
import {
  ArxMap,
  Color,
  DONT_QUADIFY,
  HudElements,
  Material,
  SHADING_SMOOTH,
  Settings,
  Texture,
  Vector3,
} from 'arx-level-generator'
import { createPlaneMesh } from 'arx-level-generator/prefabs/mesh'
import { loadRooms } from 'arx-level-generator/prefabs/rooms'
import { Speed } from 'arx-level-generator/scripting/properties'
import { createZone } from 'arx-level-generator/tools'
import { applyTransformations } from 'arx-level-generator/utils'
import { Vector2 } from 'three'

// reads the contents of the .env file
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

// load contents of assets/map.rooms and parse it
const rooms = await loadRooms('./map.rooms', settings)

// add all parsed rooms, lights and such to the map
rooms.forEach((room) => {
  map.add(room, true)
})

// ---------------------------------------------

const spawnZone = createZone({
  name: 'spawn-zone',
  position: new Vector3(0, 0, 0),
  size: new Vector3(100, Infinity, 100),
  backgroundColor: Color.fromCSS('#5a5f7a'),
  drawDistance: 2000,
})

map.zones.push(spawnZone)

// ---------------------------------------------

const water = createPlaneMesh({
  size: new Vector2(200, 200),
  tileSize: 100,
  texture: Material.fromTexture(Texture.waterCavewater, {
    flags: ArxPolygonFlags.Water | ArxPolygonFlags.NoShadow,
    opacity: 80,
  }),
})
applyTransformations(water)
water.translateX(map.config.offset.x)
water.translateY(map.config.offset.y + 10)
water.translateZ(map.config.offset.z + 900)
applyTransformations(water)
map.polygons.addThreeJsMesh(water, { tryToQuadify: DONT_QUADIFY, shading: SHADING_SMOOTH })

// ---------------------------------------------

// trigger the calculation of entity ids, rendering of script event handlers and so on...
map.finalize()

// export everything to a format which Arx can understand
await map.saveToDisk(settings)

console.log('done')
