// --- GESTORE FINANZA PERSONALE ---

let movimenti = [];
let costiFissi = [];

// Caricamento dati all'avvio
document.addEventListener('DOMContentLoaded', () => {
    // 1. Carica Movimenti Personali
    if (localStorage.getItem('dati_personale_movimenti')) {
        movimenti = JSON.parse(localStorage.getItem('dati_personale_movimenti'));
    }
    // 2. Carica Costi Fissi
    if (localStorage.getItem('dati_personale_fissi')) {
        costiFissi = JSON.parse(localStorage.getItem('dati_personale_fissi'));
    }

    // Imposta data odierna
    document.getElementById('inputData').valueAsDate = new Date();
    document.getElementById('fixInizio').valueAsDate = new Date();

    aggiornaInterfaccia();
});

// --- SEZIONE 1: MOVIMENTI QUOTIDIANI ---
function aggiungiTransazione() {
    const data = document.getElementById('inputData').value;
    const desc = document.getElementById('inputDesc').value;
    const importo = parseFloat(document.getElementById('inputImporto').value);
    const tipo = document.getElementById('inputTipo').value;

    if (!data || !desc || isNaN(importo)) { alert("Compila tutti i campi!"); return; }

    movimenti.push({ id: Date.now(), data, desc, importo, tipo });
    salvaDati();
    aggiornaInterfaccia();

    // Reset
    document.getElementById('inputDesc').value = '';
    document.getElementById('inputImporto').value = '';
}

// --- SEZIONE 2: COSTI FISSI (AMMORTAMENTO) ---
function aggiungiCostoFisso() {
    const nome = document.getElementById('fixNome').value;
    const totale = parseFloat(document.getElementById('fixImporto').value);
    const inizio = document.getElementById('fixInizio').value;
    const mesi = parseInt(document.getElementById('fixMesi').value);

    if (!nome || isNaN(totale) || !inizio || isNaN(mesi) || mesi < 1) {
        alert("Dati costo fisso non validi"); return;
    }

    costiFissi.push({
        id: Date.now(),
        nome: nome,
        totale: totale,
        dataInizio: inizio,
        durataMesi: mesi,
        rataMensile: totale / mesi
    });

    localStorage.setItem('dati_personale_fissi', JSON.stringify(costiFissi));
    aggiornaInterfaccia();

    document.getElementById('fixNome').value = '';
    document.getElementById('fixImporto').value = '';
}

// --- INTEGRAZIONE AUTOMATICA CON GESTIONALE P.IVA ---
function getStipendioBusiness(meseKey) {
    // meseKey è nel formato "YYYY-MM" (es. "2023-11")
    // Dobbiamo cercare il netto del mese PRECEDENTE nel database Business

    const datiBusinessRaw = localStorage.getItem('dati_rui_finanza');
    if (!datiBusinessRaw) return 0;

    const transazioniBusiness = JSON.parse(datiBusinessRaw);

    // Calcoliamo qual è il mese precedente a quello richiesto
    // Se chiedo report di Novembre (2023-11), voglio lo stipendio di Ottobre (2023-10)
    let dataCorrente = new Date(meseKey + "-15"); // 15 Novembre
    dataCorrente.setMonth(dataCorrente.getMonth() - 1); // Torno indietro di 1 mese -> 15 Ottobre

    const annoPre = dataCorrente.getFullYear();
    const mesePre = String(dataCorrente.getMonth() + 1).padStart(2, '0');
    const keyRicerca = `${annoPre}-${mesePre}`;

    // --- REPLICA CALCOLO NETTO DEL BUSINESS ---
    // (Dev'essere identico alla logica dell'altro file per coerenza)
    const COEFF_REDDITIVITA = 0.78;
    const ALIQUOTA_IMPOSTA = 0.05;
    const COSTI_FISSI_MENSILI_BUSINESS = (4515.43 + 200) / 12;

    let fatturato = 0;
    let spese = 0;

    transazioniBusiness.forEach(t => {
        if (t.data.startsWith(keyRicerca)) {
            if (t.tipo === 'entrata') fatturato += t.importo;
            else spese += t.importo;
        }
    });

    if (fatturato === 0 && spese === 0) return 0; // Nessuna attività

    const imponibile = fatturato * COEFF_REDDITIVITA;
    const tasse = imponibile * ALIQUOTA_IMPOSTA;
    const nettoBusiness = fatturato - spese - tasse - COSTI_FISSI_MENSILI_BUSINESS;

    return nettoBusiness;
}

// --- GENERAZIONE REPORT ---
function aggiornaInterfaccia() {
    aggiornaTabellaFissi();
    generareBilancioMensile();
}

function generareBilancioMensile() {
    const tbody = document.getElementById('tabellaBilancio');
    tbody.innerHTML = "";

    // 1. Troviamo tutti i mesi presenti (tra spese personali e costi fissi)
    let mesiSet = new Set();
    movimenti.forEach(m => mesiSet.add(m.data.substring(0, 7))); // YYYY-MM
    costiFissi.forEach(c => {
        // Aggiungi i mesi coperti dal costo fisso
        let d = new Date(c.dataInizio);
        for (let i = 0; i < c.durataMesi; i++) {
            let y = d.getFullYear();
            let m = String(d.getMonth() + 1).padStart(2, '0');
            mesiSet.add(`${y}-${m}`);
            d.setMonth(d.getMonth() + 1);
        }
    });

    // Se non c'è nulla, mostra almeno il mese corrente
    if (mesiSet.size === 0) {
        const oggi = new Date();
        mesiSet.add(`${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2, '0')}`);
    }

    const mesiOrdinati = Array.from(mesiSet).sort().reverse();

    mesiOrdinati.forEach(meseKey => {
        // A. Calcolo Spese/Entrate Variabili del mese
        let entrateExtra = 0;
        let usciteVariabili = 0;
        movimenti.forEach(m => {
            if (m.data.startsWith(meseKey)) {
                if (m.tipo === 'entrata') entrateExtra += m.importo;
                else usciteVariabili += m.importo;
            }
        });

        // B. Calcolo Costi Fissi Spalmati su questo mese
        let quotaFissaMese = 0;
        costiFissi.forEach(c => {
            // Controlla se il meseKey rientra nel periodo del costo fisso
            const start = new Date(c.dataInizio);
            // Settiamo al primo del mese per confrontare
            const check = new Date(meseKey + "-01");

            // Calcolo data fine
            const end = new Date(start);
            end.setMonth(end.getMonth() + c.durataMesi);

            if (check >= new Date(start.getFullYear(), start.getMonth(), 1) && check < end) {
                quotaFissaMese += c.rataMensile;
            }
        });

        // C. Importa lo Stipendio dal Business (Il netto del mese precedente)
        const stipendioPiva = getStipendioBusiness(meseKey);

        // D. Totali
        const totaleEntrate = stipendioPiva + entrateExtra;
        const risparmio = totaleEntrate - usciteVariabili - quotaFissaMese;

        // E. Render
        const nomeMese = new Date(meseKey + "-01").toLocaleString('it-IT', { month: 'long', year: 'numeric' });

        let labelStipendio = `€ ${stipendioPiva.toFixed(2)}`;
        if (stipendioPiva > 0) labelStipendio += ` <small>(dal Business)</small>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-transform:capitalize;">${nomeMese}</td>
            <td style="color:green;">
                ${labelStipendio}
                ${entrateExtra > 0 ? '<br>+ € ' + entrateExtra.toFixed(2) + ' (Extra)' : ''}
            </td>
            <td style="color:red;">- € ${usciteVariabili.toFixed(2)}</td>
            <td style="color:#d35400;">- € ${quotaFissaMese.toFixed(2)}</td>
            <td style="color: ${risparmio >= 0 ? '#27ae60' : '#c0392b'}; background: #fdfefe;">
                € ${risparmio.toFixed(2)}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function aggiornaTabellaFissi() {
    const tbody = document.getElementById('tabellaFissi');
    tbody.innerHTML = "";

    costiFissi.forEach(c => {
        // Calcola data fine
        let fine = new Date(c.dataInizio);
        fine.setMonth(fine.getMonth() + c.durataMesi);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${c.nome}</b></td>
            <td>€ ${c.totale.toFixed(2)}</td>
            <td>${fine.toLocaleDateString()} (${c.durataMesi} rate)</td>
            <td>€ ${c.rataMensile.toFixed(2)} / mese</td>
            <td><button onclick="rimuoviFisso(${c.id})" style="background:red; padding:5px 10px; width:auto;">X</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function rimuoviFisso(id) {
    if (confirm("Eliminare questo costo fisso?")) {
        costiFissi = costiFissi.filter(c => c.id !== id);
        localStorage.setItem('dati_personale_fissi', JSON.stringify(costiFissi));
        aggiornaInterfaccia();
    }
}

function salvaDati() {
    localStorage.setItem('dati_personale_movimenti', JSON.stringify(movimenti));
}