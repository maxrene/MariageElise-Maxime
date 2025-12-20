// ------------------------------------------------------------------------------------------------------------------
// --- INSTRUCTIONS: ------------------------------------------------------------------------------------------------
// 1. Ouvrez votre Google Sheet (Cadeaux & Contributions & RSVP).
// 2. Allez dans Extensions > Apps Script.
// 3. Remplacez TOUT le code existant par celui-ci.
// 4. Cliquez sur "Déployer" > "Gérer les déploiements" > "Modifier" (icône crayon).
// 5. Version: Sélectionnez "Nouvelle version".
// 6. Cliquez sur "Déployer".
// 7. IMPORTANT: L'URL doit rester la même.
// ------------------------------------------------------------------------------------------------------------------

// --- CONFIGURATION ---
const SHEET_NAME_CONTRIBUTIONS = "Contributions"; // Onglet pour les cadeaux
const SHEET_NAME_QUIZ = "Quizz";                  // Onglet pour le quiz
const SHEET_NAME_RSVP = "RSVP";                   // Onglet pour les RSVP

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // -----------------------------------------------------
    // CAS 1: Données JSON (Quiz ou Contributions Cadeaux)
    // -----------------------------------------------------
    // On vérifie si postData.contents existe et commence par "{" (indice de JSON)
    // ou si le type est application/json
    if (e.postData && e.postData.contents && (e.postData.type === 'application/json' || e.postData.contents.trim().startsWith('{'))) {
      const data = JSON.parse(e.postData.contents);

      // --- SOUS-CAS 1.A : RÉSULTAT DU QUIZ ---
      if (data.type === 'quiz_result') {
        let quizSheet = ss.getSheetByName(SHEET_NAME_QUIZ);
        if (!quizSheet) {
          quizSheet = ss.insertSheet(SHEET_NAME_QUIZ);
          quizSheet.appendRow(["Date", "Nom", "Score"]);
        }
        quizSheet.appendRow([new Date(), data.name, data.score]);
        return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'Quiz enregistré' })).setMimeType(ContentService.MimeType.JSON);
      }

      // --- SOUS-CAS 1.B : CONTRIBUTION CADEAU ---
      else {
        let contributionSheet = ss.getSheetByName(SHEET_NAME_CONTRIBUTIONS);
        if (!contributionSheet) {
          contributionSheet = ss.insertSheet(SHEET_NAME_CONTRIBUTIONS);
          contributionSheet.appendRow(["Timestamp", "ID_Cadeau", "Nom_Contributeur", "Montant"]);
        }
        contributionSheet.appendRow([new Date(), data.giftId, data.name, data.amount]);
        return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'Contribution enregistrée' })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // -----------------------------------------------------
    // CAS 2: Données Formulaire (RSVP)
    // -----------------------------------------------------
    // Si ce n'est pas du JSON, c'est probablement du FormData (multipart/form-data)
    else {
      let rsvpSheet = ss.getSheetByName(SHEET_NAME_RSVP);
      if (!rsvpSheet) {
        rsvpSheet = ss.insertSheet(SHEET_NAME_RSVP);
        // Création des en-têtes si nouvelle feuille
        // Structure ajustée pour correspondre aux attentes (Presence Group à la colonne G, Brunch à la colonne H)
        // A: Timestamp, B: Prénom, C: Nom, D: Email, E: Téléphone, F: Présence, G: Nb Personnes, H: Brunch, ...
        rsvpSheet.appendRow(["Timestamp", "Prénom", "Nom", "Email", "Téléphone", "Présence", "Nb Personnes", "Brunch", "Allergies", "Musique", "Invités Supp."]);
      }

      const params = e.parameter; // Contient les champs du formulaire (Prenom, Nom, Presence, Brunch...)

      // Construction de la liste des invités supplémentaires (si applicable)
      let invitesSupp = [];
      for (let i = 2; i <= 10; i++) {
        if (params[`PrenomInvite${i}`] && params[`NomInvite${i}`]) {
          let inviteStr = `${params[`PrenomInvite${i}`]} ${params[`NomInvite${i}`]}`;
           if (params[`AllergiesInvite${i}`] && params[`AllergiesInvite${i}`] !== 'Aucune') {
             inviteStr += ` (${params[`AllergiesInvite${i}`]})`;
           }
           invitesSupp.push(inviteStr);
        }
      }

      // Ajout de la ligne RSVP
      // Note: On ajoute des champs vides pour Email et Téléphone car ils ne sont pas dans le formulaire actuel
      // mais cela permet de maintenir l'alignement des colonnes demandé.
      rsvpSheet.appendRow([
        new Date(),
        params.Prenom || "",
        params.Nom || "",
        "", // Email (placeholder)
        "", // Téléphone (placeholder)
        params.Presence || "",
        params.NombredePersonnes || "", // Colonne G
        params.Brunch || "",            // Colonne H (Nouveau champ Brunch)
        params.Allergies || "",
        params.Musique || "",
        invitesSupp.join(", ")
      ]);

      return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'RSVP bien reçu !' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
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
