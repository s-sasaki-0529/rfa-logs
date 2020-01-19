var sheet = SpreadsheetApp.getActiveSheet();

function searchRow(text) {
  var textFinder = sheet.createTextFinder(text).matchEntireCell(true);
  var range = textFinder.findNext();
  return range.getRow();
}

function fetchCurrentResults() {
  var url = 'https://xncgi5na0k.execute-api.ap-northeast-1.amazonaws.com/dev?userName=Sa2Knight'
  var response = UrlFetchApp.fetch(url);
  var content = response.getContentText("UTF-8")
  return JSON.parse(content).results;
}

function updateResults() {
  var results = fetchCurrentResults()
  Object.keys(results).forEach(function(key) {
    var name = key;
    var total = results[key].value;
    var updatedAt = new Date(results[key].updatedAt);
    var row = searchRow(name)
    sheet.getRange(row, 2).setValue(total);
    sheet.getRange(row, 6).setValue(updatedAt);
  })
}

function updateBackgroundColor() {
  var rowsCount = 82;
  for (var row = 2; row <= rowsCount; row++) {
    var nextTarget = sheet.getRange(row, 4).getValue()
    var columns = sheet.getRange(row, 1, 1, 6)
    if (nextTarget === '') {
      columns.setBackgroundRGB(220, 220, 220)
    } else if (nextTarget <= 0) {
      columns.setBackgroundRGB(255, 228, 225)
    } else {
      columns.setBackgroundRGB(255, 255, 255)
    }
  }
}

function myFunction() {
  updateResults();
  updateBackgroundColor();
}