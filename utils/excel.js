const xlsx = require('xlsx');
const path = require('path');
const { randomUUID } = require('crypto');

const EXCEL_PATH = path.join(__dirname, '..', 'Work_Track.xlsx');

// headerRow: index of the row containing column headers (0-based)
const SHEET_CONFIG = {
  'Academic':         { headerRow: 1 },
  'Admin-Addl.':      { headerRow: 1 },
  'PhD Supervision':  { headerRow: 0 },
  'Pipeline':         { headerRow: 0 },
  'Published':        { headerRow: 0 },
  'Book Chapter':     { headerRow: 0 },
  'Projects':         { headerRow: 0 },
  'Conferences':      { headerRow: 0 },
  'Ideas':            { headerRow: 0 },
  'History_record':   { headerRow: 0 }
};

// Sheets visible publicly (no auth required for GET)
const PUBLIC_SHEETS = ['Published', 'Book Chapter', 'Conferences', 'Projects', 'PhD Supervision', 'Academic', 'Admin-Addl.'];

// In-memory UUID → raw row-index mapping (per sheet, refreshed on every read)
const _rowMap = {};

function getSheetNames() {
  const wb = xlsx.readFile(EXCEL_PATH);
  return wb.SheetNames;
}

function readSheet(sheetName) {
  const wb = xlsx.readFile(EXCEL_PATH, { cellDates: false });
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found`);

  const config = SHEET_CONFIG[sheetName] || { headerRow: 0 };
  const rawData = xlsx.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
    raw: false,
    dateNF: 'dd-mmm-yyyy'
  });

  if (rawData.length <= config.headerRow) return { headers: [], rows: [] };

  // Build clean header list from the header row
  const headerRow = rawData[config.headerRow] || [];
  const colMap = []; // { index, name }
  headerRow.forEach((h, i) => {
    const name = h ? String(h).trim() : null;
    if (name) colMap.push({ index: i, name });
  });
  const headers = colMap.map(c => c.name);

  // Build row objects
  _rowMap[sheetName] = {};
  const rows = [];

  for (let ri = config.headerRow + 1; ri < rawData.length; ri++) {
    const raw = rawData[ri];
    if (!raw || raw.every(c => c === null || c === undefined || c === '')) continue;

    const id = randomUUID();
    _rowMap[sheetName][id] = ri;

    const obj = { _id: id };
    colMap.forEach(({ index, name }) => {
      obj[name] = raw[index] !== undefined ? raw[index] : null;
    });
    rows.push(obj);
  }

  return { headers, rows };
}

function _resolveRowIndex(sheetName, id) {
  const map = _rowMap[sheetName];
  if (!map || map[id] === undefined) {
    throw new Error('Row not found — please refresh the table and try again.');
  }
  return map[id];
}

function _rawData(sheetName) {
  const wb = xlsx.readFile(EXCEL_PATH, { cellDates: false });
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found`);
  return xlsx.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false, dateNF: 'dd-mmm-yyyy' });
}

function _buildRowArray(sheetName, rowData) {
  const config = SHEET_CONFIG[sheetName] || { headerRow: 0 };
  const raw = _rawData(sheetName);
  const headerRow = raw[config.headerRow] || [];
  return headerRow.map(h => {
    if (!h) return null;
    const key = String(h).trim();
    return rowData[key] !== undefined ? rowData[key] : null;
  });
}

function updateRow(sheetName, id, rowData) {
  const ri = _resolveRowIndex(sheetName, id);
  const wb = xlsx.readFile(EXCEL_PATH);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found`);

  const config = SHEET_CONFIG[sheetName] || { headerRow: 0 };
  const rawData = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false, dateNF: 'dd-mmm-yyyy' });
  const headerRow = rawData[config.headerRow] || [];

  const newRow = headerRow.map(h => {
    if (!h) return null;
    const key = String(h).trim();
    return rowData[key] !== undefined ? rowData[key] : null;
  });

  rawData[ri] = newRow;
  wb.Sheets[sheetName] = xlsx.utils.aoa_to_sheet(rawData);
  xlsx.writeFile(wb, EXCEL_PATH);
}

function addRow(sheetName, rowData) {
  const wb = xlsx.readFile(EXCEL_PATH);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found`);

  const config = SHEET_CONFIG[sheetName] || { headerRow: 0 };
  const rawData = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false, dateNF: 'dd-mmm-yyyy' });
  const headerRow = rawData[config.headerRow] || [];

  const newRow = headerRow.map(h => {
    if (!h) return null;
    const key = String(h).trim();
    return rowData[key] !== undefined ? rowData[key] : null;
  });

  rawData.push(newRow);
  wb.Sheets[sheetName] = xlsx.utils.aoa_to_sheet(rawData);
  xlsx.writeFile(wb, EXCEL_PATH);
  return rawData.length - 1;
}

function deleteRow(sheetName, id) {
  const ri = _resolveRowIndex(sheetName, id);
  const wb = xlsx.readFile(EXCEL_PATH);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found`);

  const rawData = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false, dateNF: 'dd-mmm-yyyy' });
  rawData.splice(ri, 1);
  wb.Sheets[sheetName] = xlsx.utils.aoa_to_sheet(rawData);
  xlsx.writeFile(wb, EXCEL_PATH);

  // Invalidate the map entry
  delete _rowMap[sheetName][id];
}

module.exports = { getSheetNames, readSheet, updateRow, addRow, deleteRow, PUBLIC_SHEETS };
