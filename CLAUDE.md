# Enquesta comunitat de veïns

## Objectiu
Enquesta per a la comunitat de veïns (9 habitatges, 1 vot per habitatge). S'ha d'enviar a tothom com una pàgina HTML autònoma, en català, amb una portada explicativa + imatges, i un seguit de preguntes (pendents de rebre de l'usuari).

## Dades clau del projecte
- 9 habitatges en total → 9 vots esperats.
- Idioma: català.
- Format: HTML (no Google Forms "pelat" — disseny propi).
- Portada: text explicatiu + imatges (l'usuari les proporcionarà més endavant).
- Preguntes: pendents — l'usuari les donarà en una fase posterior.

## Arquitectura de recollida de respostes — DECIDIT

**Decisió final:** HTML a mida + Google Sheets via Apps Script (opció 3).

Disseny general:
- **Una sola pàgina HTML autònoma** (portada amb text explicatiu + imatges, seguida de les preguntes). Les imatges s'incrustaran en base64 (data URI) dins el mateix fitxer HTML perquè funcioni com a fitxer únic, sense dependre d'un servidor, tant si s'obre com a adjunt de correu com si es penja en algun lloc.
- **Backend:** Google Sheet nou, amb un Apps Script vinculat desplegat com a "Web App" (doPost). El formulari HTML envia les respostes amb `fetch(..., {method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain'}, body: JSON.stringify(...)})` cap a la URL del script — aquest patró evita el preflight CORS i és l'habitual per a formularis HTML → Google Sheets.
- **Estructura del Sheet:** una fila per habitatge. Columnes previstes: timestamp, identificador d'habitatge, i una columna per cada pregunta (pendents de definir).
- **Un vot per habitatge:** l'Apps Script farà un "upsert" — si ja existeix una fila amb aquest identificador d'habitatge, l'actualitza (sobreescriu la resposta anterior) en lloc de crear-ne una altra. Això garanteix com a màxim 9 files, una per habitatge, i permet corregir un vot si cal.
- **Compte de Google:** cal decidir amb quin compte de Google es crearà el Sheet/Apps Script (pendent de confirmar amb l'usuari quan arribem a la fase de construcció).

## Mecanisme per evitar vots duplicats (1 per habitatge)
A la portada, cada persona selecciona el seu habitatge en un desplegable (p. ex. "Pis 1"... "Pis 9", pendent de la nomenclatura real dels 9 habitatges). Aquest identificador és la clau que l'Apps Script usa per fer l'upsert a la fila corresponent del Sheet. Pendent de confirmar si es vol anonimat total o no dins de cada resposta.

## Contingut de la portada (decidit)
- Títol: "El nostre jardí del futur".
- Text explicatiu: és una enquesta per decidir entre tots el futur del jardí comunitari; un vot per habitatge; triga pocs minuts.
- Foto del jardí: pendent (l'usuari la donarà més endavant). De moment hi ha un placeholder visual al div `#foto-portada` a `enquesta.html` — quan arribi la foto, substituir aquest div per un `<img>` (idealment en base64 perquè el fitxer HTML segueixi sent autònom).
- Botó "Comença l'enquesta" que porta a la primera pregunta.

## Pregunta 1 (decidit)
"Quin és el teu habitatge?" — dropdown únic amb els 9 habitatges agrupats per planta (Planta Baixa / Primer Pis / Segon Pis), 3 pisos per planta. Valors interns: `PB-1/2/3`, `1R-1/2/3`, `2N-1/2/3`. Aquest valor és la clau que s'farà servir per garantir un vot per habitatge quan es connecti amb Google Sheets.

## Fitxer de treball
`enquesta.html` — pàgina única, autònoma. Arquitectura interna: un "motor de passos" en JS (seccions `.pas`, es mostra/amaga amb la classe `.actiu`, navegació Enrere/Continua) perquè sigui fàcil anar afegint preguntes noves com a nous passos *entre* `pas-1` i `pas-final`. Les respostes es desen a l'objecte JS `respostes` i s'envien a Google Sheets en prémer "Enviar la meva resposta" al pas final.

## Connexió amb Google Sheets (construïda, pendent de desplegar)
- `apps_script.gs` conté el codi del backend (Apps Script): fa un "upsert" per `habitatge` (si l'habitatge ja ha votat, actualitza la seva fila) i **afegeix columnes noves automàticament** quan apareguin noves claus a `respostes` (és a dir, quan afegim noves preguntes a l'HTML no cal tocar l'script).
- **Desplegat i verificat.** `APPS_SCRIPT_URL` a `enquesta.html` ja apunta a `https://script.google.com/macros/s/AKfycbw2aC0a2LtUbmc4v_4p4qs5bRS7yfmeRtTpYD5lN9PNM5Qzjl0OnATugcPsHMojK0rXwg/exec`. Prova real feta amb `curl` (`{"habitatge":"TEST"}` → resposta `{"status":"ok"}`): escriu correctament al full "Respostes". **Pendent que l'usuari esborri la fila de prova (`TEST`) del Sheet.**
- **Passos de desplegament (manual, a fer per l'usuari amb el seu compte de Google):**
  1. Crear un Google Sheet nou (p. ex. "Enquesta Jardí — Respostes").
  2. Extensions > Apps Script.
  3. Esborrar el codi per defecte i enganxar el contingut de `apps_script.gs`.
  4. Desar el projecte.
  5. Desplegar > Nova implementació > Tipus "Aplicació web".
     - Executar com: Jo (el propi compte).
     - Qui hi té accés: Qualsevol persona.
  6. Autoritzar els permisos quan ho demani Google (avís "app no verificada" → Configuració avançada → continuar).
  7. Copiar la URL de l'aplicació web (acaba en `/exec`) i passar-me-la, o enganxar-la directament a `APPS_SCRIPT_URL` dins `enquesta.html`.
- **Compte de Google decidit:** rctoni@gmail.com (personal).

## Estat actual
- [x] Projecte iniciat, CLAUDE.md creat.
- [x] Arquitectura de recollida de dades decidida (HTML a mida + Google Sheets via Apps Script).
- [x] Portada construïda (amb placeholder per a la foto).
- [x] Pregunta 1 construïda (dropdown d'habitatge).
- [x] Codi de connexió amb Google Sheets (Apps Script, `apps_script.gs`) i enviament des de l'HTML construïts.
- [x] Desplegar l'Apps Script al Google Sheet real i enganxar la URL a `APPS_SCRIPT_URL`.
- [x] Decidir amb quin compte de Google es crearà el Sheet/Apps Script (rctoni@gmail.com).
- [x] Provar un enviament real (prova amb `curl`, resposta `{"status":"ok"}`). Pendent: esborrar la fila "TEST" del Sheet.
- [ ] Rebre la resta de preguntes de l'enquesta de l'usuari.
- [ ] Rebre la foto/imatges per a la portada.

## Notes de treball
Aquest fitxer s'anirà actualitzant a mesura que avanci el projecte (decisions preses, preguntes rebudes, etc.).
