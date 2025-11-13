import { Entity, EntityConstructorPropsWithoutSrc, EntityModel } from 'arx-level-generator'
import { Label, Material, Shadow } from 'arx-level-generator/scripting/properties'
import { getLowestPolygonIdx, loadOBJ, normalizeUV } from 'arx-level-generator/tools/mesh'
import { Vector2 } from 'three'

type LadderConstructorProps = EntityConstructorPropsWithoutSrc & {
  name?: string
}

const ladderObj = await loadOBJ('entities/ladder/ladder', {
  centralize: true,
  verticalAlign: 'bottom',
  scale: 0.1,
  scaleUV: new Vector2(1, -1),
})

const ladderMesh = ladderObj.meshes[0]

normalizeUV(ladderMesh.geometry)

export class Ladder extends Entity {
  constructor({ ...props }: LadderConstructorProps = {}) {
    super({
      ...props,
      src: 'fix_inter/ladder',
      model: EntityModel.fromThreeJsObj(ladderMesh, {
        filename: 'ladder.ftl',
        sourcePath: 'entities/ladder',
        originIdx: getLowestPolygonIdx(ladderMesh.geometry),
      }),
      otherDependencies: [...ladderObj.materials],
    })

    this.withScript()

    this.script?.on('init', () => {
      if (this.script?.isRoot) {
        return [Shadow.off, Material.wood]
      } else {
        return [new Label(props.name ?? 'a ladder')]
      }
    })
  }
}
