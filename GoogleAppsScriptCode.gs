// ------------------------------------------------------------------------------------------------------------------
// --- INSTRUCTIONS: ------------------------------------------------------------------------------------------------
// 1. Ouvrez votre Google Sheet (Cadeaux & Contributions).
// 2. Allez dans Extensions > Apps Script.
// 3. Remplacez TOUT le code existant par celui-ci.
// 4. Cliquez sur "Déployer" > "Nouveau déploiement".
// 5. Choisissez "Application Web".
// 6. Accès: "Tout le monde" (IMPORTANT).
// 7. Cliquez sur "Déployer".
// 8. IMPORTANT: Si l'URL du script change, vous devrez mettre à jour 'appsScriptUrl' dans 'liste-script.js'.
//    (Mais normalement si vous faites "Gérer les déploiements" > "Modifier" > "Nouvelle version", l'URL reste la même).
// ------------------------------------------------------------------------------------------------------------------

// --- CONFIGURATION ---
// Remplacez ces valeurs par les IDs de VOS onglets si besoin.
// Vous pouvez trouver le 'gid' dans l'URL de votre sheet (ex: #gid=123456789)
// Ou juste utiliser le nom de l'onglet.
const SHEET_NAME_CONTRIBUTIONS = "Contributions"; // Nom de l'onglet pour les cadeaux
const SHEET_NAME_QUIZ = "Quizz";                  // Nom de l'onglet pour le quiz

function doPost(e) {
  try {
    // 1. Parsing des données reçues (JSON)
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- CAS 1: RÉSULTAT DU QUIZ ---
    if (data.type === 'quiz_result') {
      let quizSheet = ss.getSheetByName(SHEET_NAME_QUIZ);

      // Créer l'onglet s'il n'existe pas
      if (!quizSheet) {
        quizSheet = ss.insertSheet(SHEET_NAME_QUIZ);
        quizSheet.appendRow(["Date", "Nom", "Score"]); // En-têtes
      }

      // Ajouter le résultat
      quizSheet.appendRow([
        new Date(),       // Date actuelle
        data.name,        // Nom du joueur
        data.score        // Score sur 10
      ]);

      return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'Quiz enregistré' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- CAS 2: CONTRIBUTION CADEAU (Logique existante) ---
    // (Par défaut si pas de type spécifié ou type != quiz_result)
    else {
      let contributionSheet = ss.getSheetByName(SHEET_NAME_CONTRIBUTIONS);

      // Créer l'onglet s'il n'existe pas
      if (!contributionSheet) {
        contributionSheet = ss.insertSheet(SHEET_NAME_CONTRIBUTIONS);
        contributionSheet.appendRow(["Timestamp", "ID_Cadeau", "Nom_Contributeur", "Montant"]);
      }

      // Ajouter la contribution
      contributionSheet.appendRow([
        new Date(),
        data.giftId,
        data.name,
        data.amount
      ]);

      return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'Contribution enregistrée' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fonction pour gérer les requêtes OPTIONS (CORS pré-flight)
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .append("Access-Control-Allow-Origin: *")
    .append("Access-Control-Allow-Methods: POST, GET, OPTIONS")
    .append("Access-Control-Allow-Headers: Content-Type");
}
