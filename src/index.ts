// https://www.youtube.com/playlist?list=PLUDlas_Zy_qC7c5tCgTMYq2idyyT241qs
import fs from 'node:fs/promises'
import path from 'node:path'
import { Settings } from 'arx-level-generator'

const settings = new Settings()
const filename = './map.rooms'

const rawInput = await fs.readFile(path.resolve(settings.assetsDir, filename), 'utf8')

// --------------

function isWhitespace(str: string) {
  return /^\s+$/.test(str)
}

type TokenMatcher = {
  expression: RegExp
  storeValue?: boolean
}

const tokenMatchers: Record<string, TokenMatcher> = {
  keywordRoom: {
    expression: /^room$/,
  },
  keywordAdd: {
    expression: /^add$/,
  },
  keywordDefine: {
    expression: /^define$/,
  },
  keywordCeiling: {
    expression: /^ceiling$/,
  },
  keywordWall: {
    expression: /^wall$/,
  },
  keywordWallNorth: {
    expression: /^wall-north$/,
  },
  keywordWallSouth: {
    expression: /^wall-south$/,
  },
  keywordWallEast: {
    expression: /^wall-east$/,
  },
  keywordWallWest: {
    expression: /^wall-west$/,
  },
  keywordFloor: {
    expression: /^floor$/,
  },
  keywordCustom: {
    expression: /^custom$/,
  },
  keywordArx: {
    expression: /^arx$/,
  },
  keywordWith: {
    expression: /^with$/,
  },
  keywordLight: {
    expression: /^light$/,
  },
  keywordCursor: {
    expression: /^cursor$/,
  },
  keywordSave: {
    expression: /^save$/,
  },
  keywordRestore: {
    expression: /^restore$/,
  },
  keywordOff: {
    expression: /^off$/,
  },

  keywordFitX: {
    expression: /^fit-x$/,
  },
  keywordFitY: {
    expression: /^fit-y$/,
  },
  keywordStretch: {
    expression: /^stretch$/,
  },
  keywordDim: {
    expression: /^dim$/,
  },
  keywordDefault: {
    expression: /^default$/,
  },

  comment: {
    expression: /^#.*$/,
  },

  symbolCurlyOpen: {
    expression: /^\{$/,
  },
  symbolCurlyClose: {
    expression: /^\}$/,
  },
  symbolEquals: {
    expression: /^=$/,
  },

  alignment: {
    expression: /^[xyz](--|-|\+|\+\+)?$/,
  },

  variable: {
    expression: /^\$[a-zA-Z_][a-zA-Z0-9_]+$/,
    storeValue: true,
  },

  newLine: {
    expression: /^\r?\n$/,
  },

  integer: {
    expression: /^([1-9][0-9]*|0)$/,
    storeValue: true,
  },
  percentage: {
    expression: /^([1-9][0-9]*|0)%$/,
    storeValue: true,
  },
  string: {
    expression: /^\S+$/,
    storeValue: true,
  },
}

type Token = {
  type: keyof typeof tokenMatchers
  value?: string
  at: [number, number]
}

function tokenize(input: string, debug: boolean = false): Token[] {
  const tokenMatcherList = Object.entries(tokenMatchers) as [keyof typeof tokenMatchers, TokenMatcher][]

  const tokens: Token[] = []

  let lineNumber = 1
  let charNumber = 0
  let lastCharNumber = 0

  let buffer = ''
  let prevLineNumber = lineNumber
  let prevCharNumber = charNumber

  let lastMatch: [keyof typeof tokenMatchers, TokenMatcher] | undefined = undefined
  let newlineToken: Token | undefined
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    buffer += char

    if (char === '\n') {
      newlineToken = {
        type: 'newLine',
        at: [lineNumber, charNumber],
      }
      lineNumber += 1
      lastCharNumber = charNumber
      charNumber = 0
    } else {
      newlineToken = undefined
      charNumber += 1
    }

    if (isWhitespace(buffer)) {
      buffer = ''
      prevLineNumber = lineNumber
      prevCharNumber = charNumber
      continue
    }

    if (debug) {
      console.log(`${lineNumber}:${charNumber}: "${buffer}"`)
    }

    const currentMatch = tokenMatcherList.find(([, { expression }]) => {
      return expression.test(buffer)
    })

    if (currentMatch) {
      lastMatch = currentMatch
      continue
    }

    if (lastMatch) {
      if (isWhitespace(char)) {
        if (debug) {
          console.log('----------')
        }

        const token: Token = {
          type: lastMatch[0],
          at: [prevLineNumber, prevCharNumber + 1],
        }

        if (lastMatch[1].storeValue) {
          token.value = buffer.slice(0, -1)
        }

        tokens.push(token)
        if (newlineToken) {
          tokens.push(newlineToken)
        }

        buffer = ''
        prevLineNumber = lineNumber
        prevCharNumber = charNumber

        lastMatch = undefined
        i--
        if (char === '\n') {
          lineNumber -= 1
          charNumber = lastCharNumber
        } else {
          charNumber -= 1
        }

        continue
      }

      charNumber -= buffer.length - 1
      if (buffer.includes('\n')) {
        const numberOfNewlinesInBuffer = buffer.split('\n').length - 1
        lineNumber -= numberOfNewlinesInBuffer
        charNumber += lastCharNumber + numberOfNewlinesInBuffer
      }
      throw new Error(`[1] syntax error at ${lineNumber}:${charNumber}`)
    }

    if (isWhitespace(char)) {
      charNumber -= buffer.length - 1
      if (buffer.includes('\n')) {
        const numberOfNewlinesInBuffer = buffer.split('\n').length - 1
        lineNumber -= numberOfNewlinesInBuffer
        charNumber += lastCharNumber + numberOfNewlinesInBuffer
      }
      throw new Error(`[2] syntax error at ${lineNumber}:${charNumber}`)
    }
  }

  if (lastMatch) {
    const token: Token = {
      type: lastMatch[0],
      at: [prevLineNumber, prevCharNumber + 1],
    }

    if (lastMatch[1].storeValue) {
      token.value = buffer
    }

    if (newlineToken) {
      tokens.push(newlineToken)
    }
    tokens.push(token)
    buffer = ''
    prevLineNumber = lineNumber
    prevCharNumber = charNumber
  }

  if (!lastMatch && buffer !== '') {
    charNumber -= buffer.length - 1
    if (buffer.includes('\n')) {
      const numberOfNewlinesInBuffer = buffer.split('\n').length - 1
      lineNumber -= numberOfNewlinesInBuffer
      charNumber += lastCharNumber + numberOfNewlinesInBuffer
    }
    throw new Error(`[3] syntax error at ${lineNumber}:${charNumber}`)
  }

  return tokens
}

try {
  const tokens = tokenize(rawInput, false)
  tokens.forEach(({ type, at, value }) => {
    console.log(
      `${`[${at[0].toString().padStart(2)}:${at[1].toString().padEnd(2)}]`}  ${type + (value ? ` "${value}"` : '')}`,
    )
  })
} catch (e) {
  console.error(e)
}
