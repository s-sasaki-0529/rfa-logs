var COL_SKILL_NAME  = 1
var COL_TYPE        = 2
var COL_POWER       = 3
var COL_RANGE       = 4
var COL_SPAN        = 5
var COL_UNIT        = 6
var COL_RESULT      = 7
var COL_TOTAL       = 8
var COL_TARGET      = 9
var COL_TARGET_UNIT = 10
var COL_GOAL        = 11
var COL_PROGRESS    = 12
var COL_UPDATED     = 13
var COL_COMPLETED   = 14

var sheet = SpreadsheetApp.getActiveSheet();

function searchRow(text) {
  Logger.log("searched: " + text);
  var textFinder = sheet.createTextFinder(text).matchEntireCell(true);
  var range = textFinder.findNext();
  return range ? range.getRow() : null;
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
    if (row){
      Logger.log(name)
      sheet.getRange(row, COL_TOTAL).setValue(total);
      sheet.getRange(row, COL_UPDATED).setValue(updatedAt);
    }
  })
}

function updateBackgroundColor() {
  var rowsCount = 84;
  for (var row = 2; row <= rowsCount; row++) {
    var type = sheet.getRange(row, COL_TYPE).getValue()
    var columns = sheet.getRange(row, 1, 1, COL_COMPLETED)
    if (type == 'うで') {
      columns.setBackgroundRGB(255, 173, 153)
    } else if (type == 'はら') {
      columns.setBackgroundRGB(255, 255, 179)
    } else if (type == 'あし') {
      columns.setBackgroundRGB(179, 179, 255)
    } else if (type == 'ヨガ') {
      columns.setBackgroundRGB(179, 255, 179)
    } else if (type == '回復') {
      columns.setBackgroundRGB(255, 179, 255)
    } else {
      columns.setBackgroundRGB(255, 255, 255)
    }
  }
}

function update() {
  updateResults();
  updateBackgroundColor();
}