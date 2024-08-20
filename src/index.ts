/*
Room definition examples:

---------------------
 example 1:
---------------------

room add 500 300 500
*/
import fs from 'node:fs/promises'
import path from 'node:path'
import { Settings } from 'arx-level-generator'

const settings = new Settings()
const filename = './map.rooms'

const rawInput = await fs.readFile(path.resolve(settings.assetsDir, filename), 'utf8')
console.log(rawInput)
