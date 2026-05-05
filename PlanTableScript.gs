// ------------------------------------------------------------------------------------------------------------------
// --- INSTRUCTIONS POUR LE PLAN DE TABLE: --------------------------------------------------------------------------
// 1. Créez un NOUVEAU Google Sheet.
// 2. Allez dans Extensions > Apps Script.
// 3. Remplacez TOUT le code existant par celui-ci.
// 4. Cliquez sur "Déployer" > "Nouveau déploiement".
// 5. Type: "Application Web".
// 6. Exécuter en tant que: "Moi".
// 7. Qui a accès: "Tous" (très important).
// 8. Déployer et copiez l'URL de l'application web générée.
// 9. Collez cette URL dans la variable `APPS_SCRIPT_URL` du fichier `plan.html`.
// ------------------------------------------------------------------------------------------------------------------

const SHEET_NAME = "PlanData";

function initSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // On va stocker le JSON complet dans la cellule A1
    sheet.getRange("A1").setValue("{}");
  }
  return sheet;
}

function doGet(e) {
  try {
    const sheet = initSheet();
    const dataStr = sheet.getRange("A1").getValue() || "{}";

    // On renvoie le JSON
    return ContentService.createTextOutput(dataStr)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = initSheet();
    // Le front-end envoie un POST avec les données (guests, tables)
    // Pour contourner les limites de CORS sur POST, on peut envoyer en JSON brut

    let postData = "";
    if (e.postData && e.postData.contents) {
      postData = e.postData.contents;
    } else {
      postData = e.parameter.data; // Au cas où on envoie via application/x-www-form-urlencoded
    }

    if (postData) {
      // Sauvegarder la chaine JSON dans la cellule A1
      sheet.getRange("A1").setValue(postData);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Plan sauvegardé" }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data provided" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .append("Access-Control-Allow-Origin: *")
    .append("Access-Control-Allow-Methods: POST, GET, OPTIONS")
    .append("Access-Control-Allow-Headers: Content-Type");
}
