import { ArxPolygonFlags } from 'arx-convert/types'
import {
  ArxMap,
  Color,
  DONT_QUADIFY,
  Entity,
  HudElements,
  Material,
  Rotation,
  SHADING_SMOOTH,
  Settings,
  Texture,
  Vector3,
} from 'arx-level-generator'
import { createPlaneMesh } from 'arx-level-generator/prefabs/mesh'
import { loadRooms } from 'arx-level-generator/prefabs/rooms'
import { useDelay } from 'arx-level-generator/scripting/hooks'
import { PlayerControls, Speed, Variable } from 'arx-level-generator/scripting/properties'
import { createZone } from 'arx-level-generator/tools'
import { applyTransformations } from 'arx-level-generator/utils'
import { MathUtils, Vector2 } from 'three'
import { Ladder } from './entities/ladder.js'

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

// load contents of assets/map.rooms and parse it
const rooms = await loadRooms('./map.rooms', settings)

// add all parsed rooms, lights and such to the map
rooms.forEach((room) => {
  map.add(room, true)
})

// ---------------------------------------------

// add a zone right below the player's feet to change the fog color and
// the draw distance (can be also used to set an ambience sound)
const spawnZone = createZone({
  name: 'spawn-zone',
  backgroundColor: Color.fromCSS('#5a5f7a'),
  drawDistance: 2000,
})

map.zones.push(spawnZone)

// ---------------------------------------------

// you can add meshes not just via rooms, but with helper functions from arx-level-generator
const water = createPlaneMesh({
  size: new Vector2(200, 200),
  tileSize: 100,
  // adding a water texture with additional flags to make it behave like water
  texture: Material.fromTexture(Texture.waterCavewater, {
    flags: ArxPolygonFlags.Water | ArxPolygonFlags.NoShadow,
    opacity: 80,
  }),
})
applyTransformations(water)
// creating mesh by hand makes it absolute positioned, to make it relative to the
// map's offset (6000/0/6000) you have to move it on all 3 axis
// this can also be used to make additional adjustments
water.translateX(map.config.offset.x)
water.translateY(map.config.offset.y + 10)
water.translateZ(map.config.offset.z + 900)
applyTransformations(water)
// add the mesh to the map
map.polygons.addThreeJsMesh(water, { tryToQuadify: DONT_QUADIFY, shading: SHADING_SMOOTH })

// ---------------------------------------------

const playerTeleportTarget = new Variable('string', 'player_teleport_target', '')
map.player.script?.properties.push(playerTeleportTarget)

map.player.script?.on('teleport_to', () => {
  const { delay } = useDelay()

  return `
    set ${playerTeleportTarget.name} ~^$param1~

    worldfade out 1500 ${Color.fromCSS('black').toScriptColor()}
    ${PlayerControls.off}

    play FootStep_shoe_wood_step3
    ${delay(300)} play FootStep_shoe_wood_step2
    ${delay(300)} play FootStep_shoe_wood_step3
    ${delay(300)} play FootStep_shoe_wood_step4
    ${delay(300)} play FootStep_shoe_wood_step

    ${delay(300)} teleport ~${playerTeleportTarget.name}~

    ${delay(0)} worldfade in 500
    ${delay(500)} ${PlayerControls.on}
  `
})

// ---

const rootLadder = new Ladder()
rootLadder.script?.makeIntoRoot()
map.entities.push(rootLadder)

// ---

const pointA = Entity.marker.at({
  position: new Vector3(0, -10, 0),
})
map.entities.push(pointA)

const pointB = Entity.marker.at({
  position: new Vector3(0, -10, 900),
})
map.entities.push(pointB)

const ladderA = new Ladder({
  position: new Vector3(-100, 50, 0),
  orientation: new Rotation(0, MathUtils.degToRad(15), 0),
  name: 'double click to go to point b',
})
ladderA.script?.on('action', () => `sendevent teleport_to player ${pointB.ref}`)
map.entities.push(ladderA)

const ladderB = new Ladder({
  position: new Vector3(-130, 50, 900),
  orientation: new Rotation(0, MathUtils.degToRad(-7), 0),
  name: 'double click to go to point a',
})
ladderB.script?.on('action', () => `sendevent teleport_to player ${pointA.ref}`)
map.entities.push(ladderB)

// ---------------------------------------------

// trigger the calculation of entity ids, rendering of script event handlers and so on...
map.finalize(settings)

// export everything to a format which Arx can understand
await map.saveToDisk(settings)

console.log('done')
