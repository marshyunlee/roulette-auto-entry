// table name that is found at the left bottom of the actual sheet.
const tableName = "대시보드" // name of the record sheet
const topMargin = 2 // number of the title row overheads
const leftMargin = 2 // number of the left column overheads

// ========== runtime ==========
const paramKey_id = "uid"
const paramKey_nickname = "nickname"
const paramKey_reward = "result"

const ss= SpreadsheetApp.getActiveSpreadsheet()
const sheet = ss.getSheetByName(tableName)

// TODO - beware of the hardcoded cell location. Make dynamic or create sheet template
let topMarginNum = topMargin+1
const uids = sheet.getRange("A" + topMarginNum + ":A")
const nicknames = sheet.getRange("B" + topMarginNum + ":A")
const rewards = sheet.getRange("C" + leftMargin + ":Z" + leftMargin)

let updateLock = LockService.getScriptLock()

/*
GET returns the list of the roulette rewards available in the fixed range of the columns
*/
function doGet(e) {
  let rewardList = rewards.getValues()[0].filter(elem => elem != "")
  return ContentService.createTextOutput(JSON.stringify({status: "success", "data": rewardList})).setMimeType(ContentService.MimeType.JSON);
}

/*
- Google Sheet webapp's post request handler
- This does not return anything to the client
- example request body schema:
{
  "uid": "afreehp",
  "nickname": "아프리카도우미",
  "result": "공포게임"
}
*/
function doPost(e) {
  // Logger.log("recordRoulette is called: " + e)
  if (e === undefined || e === null || e.postData === undefined || e.postData === null) {
      return // invalid request; do nothing
  }

  let jsonString = e.postData.getDataAsString();
  let jsonData = JSON.parse(jsonString);
  // let jsonData = JSON.parse(`{"uid": "zxcvzc", "nickname": "ddddddd", "result": "지건" }`);

  if (jsonData !== null) {
    updateLock.tryLock(600000)
    
    targetId = jsonData[paramKey_id]
    targetNickname = jsonData[paramKey_nickname]
    targetReward = jsonData[paramKey_reward]

    if (!targetId || targetId == "") {
      return
    }
    let userIdx = findUser(targetId)
    let rewardIdx = getOrInsertConditionFromRange(rewards, targetReward, false)

    // boundary check
    if (userIdx < topMargin || rewardIdx < leftMargin) {
      return
    }

    if (targetId !== "") sheet.getRange(userIdx, 1).setValue(targetId)
    if (targetNickname !== "") sheet.getRange(userIdx, 2).setValue(targetNickname)

    // update the target cell
    Logger.log("setting the target cell: (" + userIdx + ", " + rewardIdx + ")")

    let targetCell = sheet.getRange(userIdx, rewardIdx)
    let currVal = targetCell.getValue()
    if (typeof(currVal) === "number") {
      targetCell.setValue(currVal + 1)
    } else {
      targetCell.setValue(1)
    }
    
    SpreadsheetApp.flush()
    updateLock.releaseLock()
  }
  
  // send response to notify the client upon completion
  // TODO - return failure status for retry
  return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
}

function findUser(uid) {
  let targetRange = uids.getValues()
  let empty = 0
  for (let i = 0; i < targetRange.length; i++) {
    let val = targetRange[i].shift()
    if (val.toString().replace(/[\s()]/g, '') == uid.replace(/[\s()]/g, '')) {
      return i + topMargin + 1
    }

    if (empty === 0 && val == "") {
      empty = i + topMargin + 1
    }
  }
  return empty
}

// !!!!!!!!! deprecated !!!!!!!!!!
// returns the index number of the FIRST condition found in the single-lined range
// if not found, insert the condition to the first available row (i.e., to the first empty cell)
function getOrInsertConditionFromRange(targetRange, condition, isUserSearch, targetNickname) {
  if (!condition || typeof(condition) !== "string" || condition === "") {
    return 0
  }

  let values = isUserSearch ? targetRange.getValues() : targetRange.getValues()[0]
  let margin = isUserSearch ? topMargin : leftMargin

  // iterative search for the condition as substring
  let idx = 0
  let emptySlot = 0
  let isFound = false
  for (let i = 0; i < values.length; i++) {
    idx++ // increment regardless
    if (values[i] === undefined || values[i] === null) {
      // invalid condition; skip
      continue
    }

    let targetVal = isUserSearch && values[i].length !== 0 ? values[i].shift() : values[i]
    if (
        (typeof(targetVal) === "string" && targetVal.trim() === condition) ||
        (typeof(targetVal) === "number" && targetVal.toString().trim() === condition)
      ) {
      isFound = true
      break
    } else if (targetVal === "" && emptySlot === 0) {
      emptySlot = idx
    }
  }

  // return the idx ONLY if found; otherwise return the new inserted val
  if (isFound) {
    idx += margin
    if (isUserSearch && targetNickname !== null) {
      // Logger.log("inserting nickname to:" + idx + " : " + leftMargin)
      sheet.getRange(idx, leftMargin).setValue(targetNickname)
    }
    return idx
  } else {
    // insert the user to the first empty row
    emptySlot += margin
    let cellToInsert = isUserSearch ? sheet.getRange(emptySlot, 1) : sheet.getRange(topMargin, emptySlot)
    cellToInsert.setValue(condition)
    if (isUserSearch && targetNickname !== null) {
      // Logger.log("inserting nickname to:" + emptySlot + " : " + leftMargin)
      sheet.getRange(emptySlot, leftMargin).setValue(targetNickname)
    }
    return emptySlot
  }
}