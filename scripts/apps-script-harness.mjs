/**
 * Local test harness for apps-script/Code.gs
 * ------------------------------------------
 * Loads the REAL Apps Script source into a Node VM with in-memory emulations of
 * SpreadsheetApp, LockService, CacheService, PropertiesService, ContentService
 * and Utilities. Used by the automated backend tests and the local mock server.
 *
 * This is a development tool only. It does NOT talk to Google and does NOT prove
 * the live Google Sheets integration works — that requires a real deployment.
 */
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import vm from 'node:vm'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CODE_PATH = path.resolve(__dirname, '../apps-script/Code.gs')

class FakeRange {
  constructor(sheet, row, col, numRows = 1, numCols = 1) {
    Object.assign(this, { sheet, row, col, numRows, numCols })
  }
  getRow() { return this.row }
  getValue() { return this.getValues()[0][0] }
  getValues() {
    const out = []
    for (let r = 0; r < this.numRows; r++) {
      const line = []
      for (let c = 0; c < this.numCols; c++) {
        const v = this.sheet.data[this.row - 1 + r]?.[this.col - 1 + c]
        line.push(v === undefined || v === null ? '' : v)
      }
      out.push(line)
    }
    return out
  }
  setValue(v) {
    this.sheet._assertWritable()
    this.sheet._set(this.row, this.col, v)
    return this
  }
  setValues(values) {
    this.sheet._assertWritable()
    values.forEach((line, r) => line.forEach((v, c) => this.sheet._set(this.row + r, this.col + c, v)))
    return this
  }
  setNumberFormat() { return this }
  setFontWeight() { return this }
  setBackground() { return this }
  setFontColor() { return this }
}

class FakeSheet {
  constructor(name, env) {
    this.name = name
    this.env = env
    this.data = []
  }
  _assertWritable() {
    if (this.env.failWrites) throw new Error('Simulated Google Sheets outage')
  }
  _set(row, col, v) {
    while (this.data.length < row) this.data.push([])
    const line = this.data[row - 1]
    while (line.length < col) line.push('')
    line[col - 1] = v
  }
  getName() { return this.name }
  getLastRow() { return this.data.length }
  getLastColumn() { return this.data.reduce((m, r) => Math.max(m, r.length), 0) }
  getMaxRows() { return Math.max(1000, this.data.length) }
  getRange(row, col, numRows, numCols) { return new FakeRange(this, row, col, numRows, numCols) }
  getDataRange() { return new FakeRange(this, 1, 1, this.getLastRow(), this.getLastColumn()) }
  appendRow(row) {
    this._assertWritable()
    this.data.push(row.map((v) => (v === undefined ? '' : v)))
    return this
  }
  setFrozenRows() { return this }
  deleteRow(n) {
    this._assertWritable()
    this.data.splice(n - 1, 1)
    return this
  }
  /** Test helper: rows as objects keyed by header */
  toObjects() {
    const [headers = [], ...rows] = this.data
    return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])))
  }
}

class FakeSpreadsheet {
  constructor(env) {
    this.env = env
    this.sheets = new Map()
  }
  getName() { return 'NGPL Registrations (local emulation)' }
  getId() { return 'local-emulation-spreadsheet-id' }
  getSheetByName(name) { return this.sheets.get(name) || null }
  insertSheet(name) {
    if (this.env.failWrites) throw new Error('Simulated Google Sheets outage')
    const s = new FakeSheet(name, this.env)
    this.sheets.set(name, s)
    return s
  }
}

function pad(n) { return String(n).padStart(2, '0') }

function formatDate(date, tz, fmt) {
  // Only Asia/Kolkata (UTC+05:30, no DST) is used by Code.gs
  const ist = new Date(date.getTime() + (tz === 'Asia/Kolkata' ? 330 : 0) * 60000)
  const map = {
    yyyy: String(ist.getUTCFullYear()),
    yy: String(ist.getUTCFullYear()).slice(-2),
    MM: pad(ist.getUTCMonth() + 1),
    dd: pad(ist.getUTCDate()),
    HH: pad(ist.getUTCHours()),
    mm: pad(ist.getUTCMinutes()),
    ss: pad(ist.getUTCSeconds()),
  }
  return fmt.replace(/yyyy|yy|MM|dd|HH|mm|ss/g, (t) => map[t])
}

export function createBackend({ adminKey = 'test-admin-key-123456', failWrites = false } = {}) {
  const env = { failWrites }
  const spreadsheet = new FakeSpreadsheet(env)
  const cache = new Map()
  const props = { ADMIN_KEY: adminKey }

  const context = {
    console,
    JSON,
    Date,
    Math,
    Object,
    String,
    Number,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      openById: () => spreadsheet,
      flush: () => {},
      getUi: () => { throw new Error('UI not available in web app context') },
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {} }) },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (cache.has(k) ? cache.get(k) : null),
        put: (k, v) => cache.set(k, v),
        remove: (k) => cache.delete(k),
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null) }),
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (content) => ({ setMimeType() { return this }, getContent: () => content }),
    },
    Utilities: { formatDate, getUuid: () => randomUUID() },
  }
  vm.createContext(context)
  vm.runInContext(readFileSync(CODE_PATH, 'utf8'), context, { filename: 'Code.gs' })

  return {
    env,
    spreadsheet,
    cache,
    context,
    post(body) {
      const out = context.doPost({ postData: { contents: JSON.stringify(body) } })
      return JSON.parse(out.getContent())
    },
    get(parameter = {}) {
      return JSON.parse(context.doGet({ parameter }).getContent())
    },
    sheet(name) {
      return spreadsheet.getSheetByName(name)
    },
  }
}
