const WARCRecord = require('./index')
const WFI = require('./fieldIdentifiers')

/**
 * @type {Buffer}
 */
const CRLF = WFI.crlf

/**
 * @type {Buffer}
 */
const WARCBegin = WFI.begin

/**
 * @type {{header: symbol, content1: symbol, content2: symbol, consumeCRLFHeader: symbol, consumeCRLFContent1: symbol, consumeCRLFContent2: symbol}}
 */
const parsingStates = {
  header: Symbol('warc-parsing-_header'),
  content1: Symbol('warc-parsing-content1'),
  content2: Symbol('warc-parsing-content2'),
  consumeCRLFHeader: Symbol('warc-parsing-comsume-crlf-_header'),
  consumeCRLFContent1: Symbol('warc-parsing-comsume-crlf-c1'),
  consumeCRLFContent2: Symbol('warc-parsing-comsume-crlf-c2')
}

/**
 * @type {number}
 */
const WFIBeginLen = WFI.begin.length

/**
 * @param {Buffer} line
 * @returns {boolean}
 */
function isJustCRLF (line) {
  if (line.length !== 2) return false
  return line[0] === CRLF[0] && line[1] === CRLF[1]
}

/**
 * @param {Buffer} line
 * @returns {boolean}
 */
function isWARCRevisionLine (line) {
  if (line.length > 11) return false
  let i = 0
  while (i < WFIBeginLen) {
    if (WARCBegin[i] !== line[i]) return false
    i += 1
  }
  return true
}

/**
 * @desc Progressively build warc records line by line
 */
class RecordBuilder {
  /**
   * @desc Create a new RecordBuilder
   */
  constructor () {
    /**
     * @type {{header: Buffer[], c1: Buffer[], c2: Buffer[]}}
     * @private
     */
    this._parts = {
      header: [],
      c1: [],
      c2: []
    }

    /**
     * @type {symbol}
     * @private
     */
    this._parsingState = parsingStates.header
  }

  /**
   * @returns {?WARCRecord}
   */
  buildRecord () {
    if (this._parts.header.length === 0) return null
    const newRecord = new WARCRecord(this._parts)
    this._parts.header = []
    this._parts.c1 = []
    this._parts.c2 = []
    return newRecord
  }

  /**
   * @param {Buffer} line
   * @returns {?WARCRecord}
   */
  consumeLine (line) {
    let newRecord = null
    if (isWARCRevisionLine(line)) {
      this._parsingState = parsingStates.header
      newRecord = this.buildRecord()
    }
    const isSep = isJustCRLF(line)
    switch (this._parsingState) {
      case parsingStates.header:
        if (!isSep) {
          this._parts.header.push(line)
        } else {
          this._parsingState = parsingStates.consumeCRLFHeader
        }
        break
      case parsingStates.consumeCRLFHeader:
        if (!isSep) {
          this._parts.c1.push(line)
          this._parsingState = parsingStates.content1
        }
        break
      case parsingStates.content1:
        if (!isSep) {
          this._parts.c1.push(line)
        } else {
          this._parsingState = parsingStates.consumeCRLFContent1
        }
        break
      case parsingStates.consumeCRLFContent1:
        if (!isSep) {
          this._parts.c2.push(line)
          this._parsingState = parsingStates.content2
        }
        break
      case parsingStates.content2:
        if (!isSep) {
          this._parts.c2.push(line)
        } else {
          this._parsingState = parsingStates.consumeCRLFContent2
        }
        break
      case parsingStates.consumeCRLFContent2:
        break
    }
    return newRecord
  }
}

/**
 * @type {RecordBuilder}
 */
module.exports = RecordBuilder