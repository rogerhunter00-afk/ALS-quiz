const SHEET_NAME = 'Questions';

function doPost(e) {
  const action = e.parameter.action;
  if (action === 'addQuestions') {
    return handleAddQuestions(e);
  }
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    errors: ['Unsupported action']
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleAddQuestions(e) {
  let data = [];
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      errors: ['Invalid JSON'],
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (!Array.isArray(data)) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      errors: ['Expected an array of questions'],
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      errors: ['Sheet not found'],
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const required = ['quiz', 'type', 'question', 'correct', 'explanation'];
  const rows = [];
  const errors = [];

  data.forEach((item, index) => {
    const rowErrors = [];
    required.forEach(field => {
      if (!item[field]) {
        rowErrors.push(`${field} is required`);
      }
    });
    if (item.type === 'multiple' && (!item.options || !item.options.length)) {
      rowErrors.push('options are required for multiple choice');
    }

    if (rowErrors.length) {
      errors.push({ index: index, errors: rowErrors });
      return;
    }

    const options = item.options ? JSON.stringify(item.options) : '';
    rows.push([item.quiz, item.type, item.question, options, item.correct, item.explanation]);
  });

  if (rows.length) {
    if (typeof sheet.appendRows === 'function') {
      sheet.appendRows(rows);
    } else {
      rows.forEach(row => sheet.appendRow(row));
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    inserted: rows.length,
    errors: errors,
  })).setMimeType(ContentService.MimeType.JSON);
}
