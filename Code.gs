const SHEET_NAME = 'Questions';

function doPost(e) {
  const action = e.parameter.action;
  if (action === 'addQuestion') {
    return handleAddQuestion(e);
  }
  if (action === 'bulkImport') {
    return handleBulkImport(e);
  }
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    errors: ['Unsupported action']
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleAddQuestion(e) {
  let data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      errors: ['Invalid JSON']
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const errors = [];
  const required = ['quiz', 'type', 'question', 'correct', 'explanation'];
  required.forEach(field => {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  });
  if (data.type === 'multiple' && (!data.options || !data.options.length)) {
    errors.push('options are required for multiple choice');
  }

  if (errors.length) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      errors: errors
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      errors: ['Sheet not found']
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const options = data.options ? JSON.stringify(data.options) : '';
  sheet.appendRow([data.quiz, data.type, data.question, options, data.correct, data.explanation]);

  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function handleBulkImport(e) {
  let questions = [];
  try {
    questions = JSON.parse(e.postData.contents);
    if (!Array.isArray(questions)) {
      throw new Error('Invalid format');
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      errors: ['Invalid JSON']
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      errors: ['Sheet not found']
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const required = ['quiz', 'type', 'question', 'correct', 'explanation'];
  let successCount = 0;
  const errorDetails = [];

  questions.forEach((data, index) => {
    const errors = [];
    required.forEach(field => {
      if (!data[field]) {
        errors.push(`${field} is required`);
      }
    });
    if (data.type === 'multiple' && (!data.options || !data.options.length)) {
      errors.push('options are required for multiple choice');
    }

    if (errors.length) {
      errorDetails.push({ index: index + 1, errors: errors });
    } else {
      const options = data.options ? JSON.stringify(data.options) : '';
      sheet.appendRow([data.quiz, data.type, data.question, options, data.correct, data.explanation]);
      successCount++;
    }
  });

  return ContentService.createTextOutput(JSON.stringify({
    success: errorDetails.length === 0,
    summary: {
      successful: successCount,
      failed: errorDetails.length
    },
    errors: errorDetails
  })).setMimeType(ContentService.MimeType.JSON);
}
