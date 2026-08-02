/**
 * ==============================================================================
 * HỆ THỐNG TỰ ĐỘNG CẬP NHẬT GOOGLE SHEET, CÀO VERSION & ĐẨY DỮ LIỆU LÊN GITHUB
 * ==============================================================================
 */

/**
 * Tự động chạy khi gọi Web App
 */
function doGet(e) {
  var paramName = e ? e.parameter.name : null; 
  var paramType = e ? e.parameter.type : null; 

  if (!paramName) {
    return ContentService.createTextOutput("Lỗi: Thiếu tham số 'name' trên URL. Ví dụ: ?name=scripta")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  paramName = paramName.trim();
  var scriptProperties = PropertiesService.getScriptProperties();
  var lastUpdated = scriptProperties.getProperty("LAST_UPDATED") || "0";
  var cacheKey = "script_" + paramName + "_" + (paramType || "default") + "_" + lastUpdated;
  var cache = CacheService.getScriptCache();
  var cachedData = cache.get(cacheKey);

  var finalContent = "";
  var dataType = "";

  if (cachedData !== null) {
    var parsed = JSON.parse(cachedData);
    finalContent = parsed.content;
    dataType = parsed.type;
  } else {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Data");
    if (!sheet) {
      return ContentService.createTextOutput("Lỗi: Không tìm thấy trang tính 'Data'")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    var values = sheet.getDataRange().getValues();
    var rawContent = "";

    for (var i = 1; i < values.length; i++) {
      var rowName = String(values[i][0]).trim();
      if (rowName === paramName) {
        rawContent = String(values[i][1]);
        dataType = values[i][2];
        break; 
      }
    }

    if (rawContent === "") {
      return ContentService.createTextOutput("Lỗi: Không tìm thấy dữ liệu cho script '" + paramName + "'")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    finalContent = cleanString(rawContent);

    if (paramType) {
      dataType = paramType.trim().toLowerCase();
    } else if (dataType) {
      dataType = String(dataType).trim().toLowerCase();
    } else {
      dataType = "text";
    }

    try {
      cache.put(cacheKey, JSON.stringify({ content: finalContent, type: dataType }), 21600); 
    } catch (err) {}
  }

  var output = ContentService.createTextOutput(finalContent);

  switch (dataType) {
    case "js":
    case "javascript":
      return output.setMimeType(ContentService.MimeType.JAVASCRIPT);
    case "json":
      return output.setMimeType(ContentService.MimeType.JSON);
    case "css":
      return output.setMimeType(ContentService.MimeType.CSS);
    case "html":
      return output.setMimeType(ContentService.MimeType.HTML);
    default:
      return output.setMimeType(ContentService.MimeType.TEXT);
  }
}

// Menu hệ thống trên Google Sheets
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Tự Cập Nhật')
    .addItem('Chạy cập nhật theo bộ lọc', 'batchUpdateAllPlugins')
    .addItem('Đồng bộ JSON sang CODE & GitHub', 'convertSheetToJsonAndSave')
    .addItem('Cập nhật Youngbi ngay', 'fetchAndWritePluginsData')
    .addSeparator()
    .addItem('⚙️ Kích hoạt tự động chạy khi MỞ SHEET', 'createOnOpenTrigger')
    .addItem('⚙️ Kích hoạt tự động chạy MỖI NGÀY', 'createDailyTrigger')
    .addToUi();
}

/**
 * Hàm tự động theo dõi sửa đổi dữ liệu trên Sheet
 * Có cơ chế Debounce 60 giây tránh spam gửi request liên tục
 */
function customOnEdit(e) {
  // 1. Kiểm tra sự kiện chọn ở Cột H (CDN / GITHUB / RAW)
  getCDN(e);

  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  if (sheet.getName() !== "plugin.json") return;

  var startColumn = e.range.getColumn();
  var endColumn = e.range.getLastColumn();

  // Danh sách các cột cần theo dõi chỉnh sửa: C (3), H (8), L (12), M (13)
  var targetColumns = [3, 8, 12, 13];
  var isTargetEdited = false;

  for (var col = startColumn; col <= endColumn; col++) {
    if (targetColumns.indexOf(col) !== -1) {
      isTargetEdited = true;
      break;
    }
  }

  // 2. Nếu có chỉnh sửa thuộc các cột theo dõi
  if (isTargetEdited) {
    var now = new Date().getTime();
    var scriptProperties = PropertiesService.getScriptProperties();

    // Cập nhật mốc thời điểm chỉnh sửa mới nhất & xóa Cache
    scriptProperties.setProperty("LAST_EDIT_TIME", now.toString());
    scriptProperties.setProperty("LAST_UPDATED", now.toString());

    // Chờ 60 giây (60.000 ms) xem người dùng có thao tác tiếp hay không
    Utilities.sleep(60000);

    // Kiểm tra lại thời điểm sửa cuối cùng từ bộ nhớ
    var latestEditTime = parseInt(scriptProperties.getProperty("LAST_EDIT_TIME") || "0", 10);

    // Nếu sau 60 giây mà mốc thời gian không đổi -> Người dùng đã ngừng sửa -> Tiến hành đồng bộ GitHub
    if (now === latestEditTime) {
      convertSheetToJsonAndSave();
    } else {
      Logger.log("⏳ Bỏ qua lượt đẩy này vì phát hiện thao tác chỉnh sửa mới trong vòng 60s...");
    }
  }
}

/**
 * Xử lý sự kiện khi chọn Value tại Cột H (Cột 8)
 * Hỗ trợ các lựa chọn: CDN, GITHUB, RAW
 */
function getCDN(e) {
  if (!e || !e.range) return;
  const range = e.range;
  const sheet = range.getSheet();

  if (sheet.getName() !== "plugin.json" || range.getRow() < 2) return;

  const editedColumn = range.getColumn(); 
  if (editedColumn === 8) { // Cột H
    const row = range.getRow();
    const checkValue = sheet.getRange(row, 8).getValue().toString().trim().toUpperCase();

    var rowGit = sheet.getRange(row, 10); // Cột J
    var rowVer = sheet.getRange(row, 3);  // Cột C

    // --- TRƯỜNG HỢP 1: Chọn GITHUB hoặc RAW ---
    if (checkValue === "GITHUB" || checkValue === "RAW") {
      var scriptUrl = sheet.getRange(row, 4).getValue().toString().trim(); // Lấy URL ở cột D
      
      if (!scriptUrl) {
        thongBaoToast("⚠️ Lỗi: Đường dẫn file script ở cột D đang trống!");
        return;
      }

      // Đổi màu thông báo đang xử lý
      rowVer.setBackground("#ff0000").setFontColor("#ffffff");
      SpreadsheetApp.flush();

      // Gọi hàm cào version từ URL ở cột D
      var success = fetchAndSetVersionFromUrl(sheet, row, scriptUrl);
      
      if (success) {
        rowVer.setBackground("#2ecc71").setFontColor("#155724");
        thongBaoToast("✅ Đã tự động cập nhật Version từ link Script (Cột D)!");
      } else {
        rowVer.setBackground("#f39c12").setFontColor("#ffffff");
        thongBaoToast("⚠️ Không tìm thấy thông tin Version trong file Script.");
      }

      Utilities.sleep(1500);
      resetRowColor(rowGit, rowVer);
    } 
    
    // --- TRƯỜNG HỢP 2: Chọn CDN ---
    else if (checkValue.indexOf("CDN") > -1) {
      rowGit.setBackground("#ff0000").setFontColor("#ffffff");
      rowVer.setBackground("#ff0000").setFontColor("#ffffff");
      SpreadsheetApp.flush();

      const githubLinkraw = sheet.getRange(row, 6).getValue().toString().trim();
      const githubLink = convertRawToBlobUrl(githubLinkraw);

      if (!githubLink) {
        thongBaoToast("⚠️ Lỗi: Link dự án trống");
        resetRowColor(rowGit, rowVer);
        return;
      }

      try {
        const regex = /github\.com\/([^/]+)\/([^/]+)\/(blob|raw)\/([^/]+)\/(.+)/;
        const match = githubLink.match(regex);

        if (match) {
          const user = match[1];
          const repo = match[2];
          const branch = match[4]; 
          const filePath = match[5]; 
          const apiUrl = `https://api.github.com/repos/${user}/${repo}/commits?sha=${branch}`;

          let response;
          let isSuccess = false;
          const startTime = new Date().getTime(); 
          const timeoutLimit = 60 * 1000; 

          while ((new Date().getTime() - startTime) < timeoutLimit) {
            try {
              response = UrlFetchApp.fetch(apiUrl, { "muteHttpExceptions": true });
              if (response && response.getResponseCode() == 200) {
                isSuccess = true;
                break; 
              }
            } catch (fetchError) {}
            Utilities.sleep(2000); 
          }

          if (isSuccess && response) {
            const commitsArray = JSON.parse(response.getContentText());
            if (commitsArray.length > 0) {
              const latestCommitSha = commitsArray[0].sha; 
              const githackUrl = `https://rawcdn.githack.com/${user}/${repo}/${latestCommitSha}/${filePath}`;

              rowGit.setValue(githackUrl);
              getVersion(sheet, row, githackUrl);
              SpreadsheetApp.flush(); 

              rowGit.setBackground("#2ecc71").setFontColor("#155724");
              rowVer.setBackground("#2ecc71").setFontColor("#155724");
              thongBaoToast("✅ Tạo link & cập nhật Version thành công!");

              Utilities.sleep(2000); 
              resetRowColor(rowGit, rowVer);
            } else {
              thongBaoToast("⚠️ Lỗi: Repo không có commit nào");
              resetRowColor(rowGit, rowVer);
            }
          } else {
            const errorCode = (response) ? response.getResponseCode() : "Không phản hồi";
            thongBaoToast("⚠️ Lỗi: Quá thời gian 60s. Mã: " + errorCode);
            resetRowColor(rowGit, rowVer);
          }
        } else {
          thongBaoToast("⚠️ Lỗi: Link gốc không đúng định dạng GitHub");
          resetRowColor(rowGit, rowVer);
        }
      } catch (error) {
        resetRowColor(rowGit, rowVer);
        thongBaoToast("⚠️ Lỗi hệ thống: Xử lý dữ liệu thất bại");
      }
    }
  }
}

/**
 * Tải nội dung từ URL Script ở cột D và trích xuất version ghi vào Cột C
 */
function fetchAndSetVersionFromUrl(sheet, row, rawUrl) {
  var cellVersion = sheet.getRange(row, 3); // Cột C
  
  // Tự động chuyển link GitHub blob dạng thường sang link raw
  var targetUrl = rawUrl;
  if (targetUrl.indexOf("github.com") !== -1 && targetUrl.indexOf("/blob/") !== -1) {
    targetUrl = targetUrl.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
  }

  try {
    var response = UrlFetchApp.fetch(targetUrl, { "muteHttpExceptions": true });
    if (response.getResponseCode() !== 200) {
      Logger.log("Lỗi tải URL: Mã HTTP " + response.getResponseCode());
      return false;
    }

    var contentText = response.getContentText();
    
    // Biểu thức chính quy (Regex) quét các kiểu khai báo version:
    // 1. "version": "1.0" hoặc 'version': '1.0'
    // 2. version: "1.0" hoặc version: '1.0'
    // 3. @version 1.0
    var versionRegex = /(?:["']?version["']?\s*:\s*["']([^"']+)["'])|(?:@version\s+([0-9\.]+))/i;
    var match = contentText.match(versionRegex);

    if (match) {
      var extractedVersion = match[1] || match[2];
      if (extractedVersion) {
        cellVersion.setNumberFormat("@"); // Định dạng kiểu chuỗi Text để giữ nguyên số 1.0
        cellVersion.setValue(extractedVersion.trim());
        return true;
      }
    }
  } catch (e) {
    Logger.log("Lỗi khi tải hoặc trích xuất version: " + e.message);
  }
  return false;
}

/**
 * Hàm lấy Version cho CDN
 */
function getVersion(sheet, $row, githackUrl) {
  fetchAndSetVersionFromUrl(sheet, $row, githackUrl);
}

/**
 * Đọc dữ liệu từ Sheet CODE và đồng bộ 3 file lên GitHub
 */
function convertSheetToJsonAndSave() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("plugin.json"); 
  var targetSheet = ss.getSheetByName("CODE"); 

  if (!sourceSheet || !targetSheet) return;

  // 1. Cập nhật dữ liệu vào ô B3 của Sheet CODE (nếu cần build tự động)
  var values = sourceSheet.getDataRange().getValues();
  if (values.length > 1) {
    var pluginsArray = [];
    for (var i = 1; i < values.length; i++) {
      var id = cleanString(values[i][0]); 
      var name = cleanString(values[i][1]); 
      var version = cleanString(values[i][2]); 
      var scriptUrl = cleanString(values[i][3]); 
      var iconUrl = cleanString(values[i][4]); 

      if (id !== "") {
        pluginsArray.push({
          "id": id,
          "name": name,
          "version": String(version), 
          "scriptUrl": scriptUrl,
          "iconUrl": iconUrl
        });
      }
    }

    var finalJsonObject = {
      "version": 1,
      "plugins": pluginsArray
    };
   // targetSheet.getRange("B3").setValue(JSON.stringify(finalJsonObject, null, 2));
  }

  // 2. Lấy nội dung từ các ô tương ứng trên Sheet CODE
  var filexContent = targetSheet.getRange("B3").getValue().toString();
  var moviexContent = targetSheet.getRange("B5").getValue().toString();
  var xfileContent = targetSheet.getRange("B6").getValue().toString();

  // 3. Tiến hành đẩy từng file lên GitHub repo: alokillgtv03/vaxplugins
  thongBaoToast("Đang đồng bộ 3 file JSON lên GitHub...");

  var res1 = pushFileToGitHub("alokillgtv03", "vaxplugins", "filex.json", filexContent);
  var res2 = pushFileToGitHub("alokillgtv03", "vaxplugins", "moviex.json", moviexContent);
  var res3 = pushFileToGitHub("alokillgtv03", "vaxplugins", "xfile.json", xfileContent);

  if (res1 && res2 && res3) {
    thongBaoToast("✅ Đã cập nhật thành công 3 file (filex, moviex, xfile) lên GitHub!");
  } else {
    thongBaoToast("⚠️ Có lỗi xảy ra khi đẩy file lên GitHub, vui lòng kiểm tra Log!");
  }
}

/**
 * Hàm phụ trợ cập nhật 1 file lên GitHub repository qua API
 */
function pushFileToGitHub(owner, repo, filePath, contentText) {
  var token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
  if (!token) {
    Logger.log("Lỗi: Chưa cấu hình GITHUB_TOKEN trong Script Properties.");
    return false;
  }

  var branch = "main";
  var apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  var headers = {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Google-Apps-Script"
  };

  try {
    // Lấy Mã SHA của file nếu file đã tồn tại trên repo
    var fileSha = "";
    var getResponse = UrlFetchApp.fetch(`${apiUrl}?ref=${branch}`, {
      "method": "get",
      "headers": headers,
      "muteHttpExceptions": true
    });

    if (getResponse.getResponseCode() === 200) {
      fileSha = JSON.parse(getResponse.getContentText()).sha;
    }

    // Mã hóa nội dung sang Base64
    var encodedContent = Utilities.base64Encode(contentText, Utilities.Charset.UTF_8);

    var payload = {
      "message": "Auto update " + filePath + " from Google Sheet",
      "content": encodedContent,
      "branch": branch
    };

    if (fileSha) {
      payload.sha = fileSha;
    }

    // Gửi yêu cầu cập nhật (PUT)
    var putResponse = UrlFetchApp.fetch(apiUrl, {
      "method": "put",
      "headers": headers,
      "contentType": "application/json",
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    });

    var status = putResponse.getResponseCode();
    if (status === 200 || status === 201) {
      Logger.log("✅ Cập nhật file " + filePath + " thành công!");
      return true;
    } else {
      Logger.log("❌ Lỗi đẩy file " + filePath + ": " + putResponse.getContentText());
      return false;
    }
  } catch (err) {
    Logger.log("❌ Lỗi kết nối GitHub: " + err.toString());
    return false;
  }
}

function batchUpdateAllPlugins() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("plugin.json");
  var linkSheet = ss.getSheetByName("Link");

  if (!sheet || !linkSheet) {
    thongBaoToast("Lỗi: Không tìm thấy sheet 'plugin.json' hoặc 'Link'");
    return;
  }

  var ui = SpreadsheetApp.getUi();
  var responsePrompt = ui.prompt(
    '🎯 CHỌN LOẠI SCRIPT CẦN CẬP NHẬT',
    'Nhập loại cần update (Ví dụ: "Tất cả" hoặc tên loại ở cột M):',
    ui.ButtonSet.OK_CANCEL
  );

  if (responsePrompt.getSelectedButton() !== ui.Button.OK) {
    thongBaoToast("Đã hủy quá trình cập nhật.");
    return;
  }

  var targetType = responsePrompt.getResponseText().toString().trim().toLowerCase();
  if (targetType === "") {
    thongBaoToast("Lỗi: Bạn chưa nhập loại script cần update!");
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    thongBaoToast("Không có dữ liệu hàng để cập nhật");
    return;
  }

  var isAll = (targetType === "tất cả" || targetType === "tat ca" || targetType === "all");
  var updateCount = 0;

  for (var row = 2; row <= lastRow; row++) {
    var idCheck = sheet.getRange(row, 1).getValue().toString().trim();
    if (idCheck === "") continue;

    var currentType = sheet.getRange(row, 13).getValue().toString().trim().toLowerCase();

    if (!isAll && currentType !== targetType) continue; 

    updateCount++;

    var pluginName = sheet.getRange(row, 2).getValue().toString().trim();
    var oldVersion = sheet.getRange(row, 3).getValue().toString().trim();
    var rowGit = sheet.getRange(row, 10);
    var rowVer = sheet.getRange(row, 3);

    rowGit.setBackground("#ff0000").setFontColor("#ffffff");
    rowVer.setBackground("#ff0000").setFontColor("#ffffff");
    SpreadsheetApp.flush();

    var githubLinkraw = sheet.getRange(row, 6).getValue().toString().trim();
    var githubLink = convertRawToBlobUrl(githubLinkraw);

    if (!githubLink) {
      writeVerticalLog(linkSheet, "B", "Hàng " + row + " (" + pluginName + "): Link dự án trống.");
      resetRowColor(rowGit, rowVer);
      continue; 
    }

    var regex = /github\.com\/([^/]+)\/([^/]+)\/(blob|raw)\/([^/]+)\/(.+)/;
    var match = githubLink.match(regex);

    if (!match) {
      writeVerticalLog(linkSheet, "B", "Hàng " + row + " (" + pluginName + "): Bỏ qua do link sai định dạng GitHub.");
      resetRowColor(rowGit, rowVer);
      continue;
    }

    var user = match[1];
    var repo = match[2];
    var branch = match[4]; 
    var filePath = match[5]; 
    var apiUrl = `https://api.github.com/repos/${user}/${repo}/commits?sha=${branch}`;

    var startTime = new Date().getTime();
    var timeoutLimit = 60 * 1000; 
    var isSuccess = false;
    var response = null;
    var errorMsg = "Quá thời gian 1 phút không phản hồi";

    while ((new Date().getTime() - startTime) < timeoutLimit) {
      try {
        response = UrlFetchApp.fetch(apiUrl, { "muteHttpExceptions": true });
        if (response && response.getResponseCode() == 200) {
          isSuccess = true;
          break; 
        } else if (response) {
          errorMsg = "HTTP Status " + response.getResponseCode();
        }
      } catch (fetchError) {
        errorMsg = fetchError.message;
      }
      Utilities.sleep(3000);
    }

    if (isSuccess && response) {
      try {
        var commitsArray = JSON.parse(response.getContentText());
        if (commitsArray.length > 0) {
          var latestCommitSha = commitsArray[0].sha; 
          var githackUrl = `https://rawcdn.githack.com/${user}/${repo}/${latestCommitSha}/${filePath}`;
          rowGit.setValue(githackUrl);
          getVersion(sheet, row, githackUrl);
          SpreadsheetApp.flush(); 

          var newVersion = sheet.getRange(row, 3).getValue().toString().trim();

          if (newVersion !== oldVersion) {
            writeVerticalLog(linkSheet, "C", "Cập nhật mới [" + currentType.toUpperCase() + "]: " + pluginName + " | Bản cũ: " + oldVersion + " -> Bản mới: " + newVersion);
          }

          rowGit.setBackground("#2ecc71").setFontColor("#155724");
          rowVer.setBackground("#2ecc71").setFontColor("#155724");
          thongBaoToast("Hàng " + row + " (" + pluginName + ") cập nhật thành công!");
          Utilities.sleep(1500);
        } else {
          writeVerticalLog(linkSheet, "B", "Hàng " + row + " (" + pluginName + "): Repo GitHub không có commit nào.");
        }
      } catch(e) {
        writeVerticalLog(linkSheet, "B", "Hàng " + row + " (" + pluginName + "): Lỗi xử lý dữ liệu - " + e.message);
      }
    } else {
      thongBaoToast("Lỗi hàng " + row + ": " + errorMsg);
      writeVerticalLog(linkSheet, "B", "Hàng " + row + " (" + pluginName + ") lỗi: " + errorMsg);
    }

    resetRowColor(rowGit, rowVer);
  }

  // Tự đồng bộ build và đẩy file lên GitHub
  convertSheetToJsonAndSave();

  if (updateCount === 0) {
    thongBaoToast("Không tìm thấy hàng nào thuộc loại: " + responsePrompt.getResponseText());
  } else {
    thongBaoToast("Đã hoàn tất cập nhật " + updateCount + " hàng thuộc nhóm yêu cầu!");
  }
}

// Các hàm tiện ích hỗ trợ
function resetRowColor(range1, range2) {
  if (range1) range1.setBackground("#ffffff").setFontColor("#000000");
  if (range2) range2.setBackground("#ffffff").setFontColor("#000000");
  SpreadsheetApp.flush();
}

function writeVerticalLog(sheet, columnLetter, message) {
  var logContent = "[" + getFormattedTime() + "] " + message;
  var targetRange = sheet.getRange(columnLetter + "1");
  targetRange.insertCells(SpreadsheetApp.Dimension.ROWS);
  sheet.getRange(columnLetter + "1").setValue(logContent);
  Logger.log(logContent);
}

function getFormattedTime() {
  return Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
}

function convertRawToBlobUrl(rawUrl) {
  if (!rawUrl) return "";
  const regex = /raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/;
  const match = rawUrl.match(regex);
  if (match) {
    return `https://github.com/${match[1]}/${match[2]}/blob/${match[3]}/${match[4]}`;
  }
  return rawUrl;
}

function thongBaoToast($msg) {
  SpreadsheetApp.getActiveSpreadsheet().toast($msg, "Hệ thống", 4);
}

function cleanString(rawVal) {
  if (rawVal === undefined || rawVal === null) return "";
  var str = String(rawVal).trim();
  if (str.startsWith('"') && str.endsWith('"') && str.length >= 2) {
    str = str.substring(1, str.length - 1);
  }
  str = str.replace(/""/g, '"');
  return str.trim();
}

function fetchAndWritePluginsData() {
  var url = "https://raw.githubusercontent.com/youngbi/repo/main/plugins.json";
  var sheetName = "plugin Youngbi";

  try {
    var response = UrlFetchApp.fetch(url);
    var data = JSON.parse(response.getContentText());
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange("A1:E1").setValues([["ID", "Name", "Version", "Script URL", "Icon URL"]]);
      sheet.getRange("A1:E1").setFontWeight("bold");
    }

    var plugins = data.plugins || [];
    var rows = plugins.map(function(item) {
      return [item.id || "", item.name || "", item.version || "", item.scriptUrl || "", item.iconUrl || ""];
    });

    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
    }

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 5).setValues(rows);
    }
    thongBaoToast("Cập nhật dữ liệu Youngbi thành công!");
  } catch (error) {
    thongBaoToast("Lỗi: " + error.toString());
  }
}

function createOnOpenTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allTriggers = ScriptApp.getUserTriggers(ss);
  for (var i = 0; i < allTriggers.length; i++) {
    if (allTriggers[i].getHandlerFunction() === "fetchAndWritePluginsData" && 
        allTriggers[i].getEventType() === ScriptApp.EventType.ON_OPEN) {
      ScriptApp.deleteTrigger(allTriggers[i]);
    }
  }
  ScriptApp.newTrigger("fetchAndWritePluginsData").forSpreadsheet(ss).onOpen().create();
  SpreadsheetApp.getUi().alert("✅ Đã kích hoạt Trigger mở Sheet!");
}

function createDailyTrigger() {
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; i++) {
    if (allTriggers[i].getHandlerFunction() === "fetchAndWritePluginsData") {
      ScriptApp.deleteTrigger(allTriggers[i]);
    }
  }
  ScriptApp.newTrigger("fetchAndWritePluginsData").timeBased().everyDays(1).atHour(8).create();
  SpreadsheetApp.getUi().alert("Đã cài lịch chạy 8h sáng!");
}