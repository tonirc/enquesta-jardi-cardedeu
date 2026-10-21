/**
 * Backend de l'enquesta del jardí.
 * Rep les respostes enviades des de enquesta.html i les desa al full "Respostes".
 * Fa un "upsert": si l'habitatge ja ha votat, actualitza la seva fila en lloc
 * de crear-ne una altra, garantint un vot per habitatge.
 *
 * Instal·lació: Extensions > Apps Script al Google Sheet, enganxar aquest
 * codi, i desplegar com a "Aplicació web" (veure CLAUDE.md per als passos).
 */

const NOM_FULL = 'Respostes';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = obtenirFull();
    const dades = JSON.parse(e.postData.contents);

    const capçaleres = assegurarCapçaleres(sheet, dades);
    const filaDestí = trobarFilaHabitatge(sheet, capçaleres, dades.habitatge);

    const valors = capçaleres.map(function (h) {
      if (h === 'timestamp') return new Date();
      if (h === 'habitatge') return dades.habitatge || '';
      return dades[h] !== undefined ? dades[h] : '';
    });

    sheet.getRange(filaDestí, 1, 1, valors.length).setValues([valors]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function obtenirFull() {
  const llibre = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = llibre.getSheetByName(NOM_FULL);
  if (!sheet) {
    sheet = llibre.insertSheet(NOM_FULL);
  }
  return sheet;
}

/**
 * Assegura que la fila 1 té capçaleres per a totes les claus de `dades`.
 * Afegeix columnes noves automàticament si arriben preguntes noves.
 * Retorna l'array de capçaleres actual.
 */
function assegurarCapçaleres(sheet, dades) {
  let capçaleres;
  const lastCol = sheet.getLastColumn();

  if (lastCol === 0) {
    capçaleres = ['timestamp', 'habitatge'];
    sheet.getRange(1, 1, 1, capçaleres.length).setValues([capçaleres]);
  } else {
    capçaleres = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }

  Object.keys(dades).forEach(function (clau) {
    if (clau === 'habitatge') return;
    if (capçaleres.indexOf(clau) === -1) {
      capçaleres.push(clau);
      sheet.getRange(1, capçaleres.length).setValue(clau);
    }
  });

  return capçaleres;
}

/**
 * Retorna el número de fila on s'ha d'escriure aquest habitatge:
 * la seva fila existent si ja havia votat, o una de nova si no.
 */
function trobarFilaHabitatge(sheet, capçaleres, habitatge) {
  const colHabitatge = capçaleres.indexOf('habitatge') + 1;
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    const valors = sheet.getRange(2, colHabitatge, lastRow - 1, 1).getValues();
    for (let i = 0; i < valors.length; i++) {
      if (valors[i][0] === habitatge) {
        return i + 2;
      }
    }
  }

  return lastRow + 1;
}
