// --- CONFIGURAZIONE RUI SEZ. E (FORFETTARIO) ---
const COEFF_REDDITIVITA = 0.78;
const ALIQUOTA_IMPOSTA = 0.05;  // 5% Start-up (Modifica a 0.15 se > 5 anni)

// COSTI FISSI ANNUALI
const INPS_FISSO_ANNUO = 4515.43; // Minimale Commercianti 2024
const COMMERCIALISTA_ANNUO = 200.00; // La tua parcella pattuita

// COSTI FISSI MENSILI (Quello che devi "accantonare" ogni mese anche se fatturi 0)
const COSTO_MENSE_INPS = INPS_FISSO_ANNUO / 12;
const COSTO_MENSE_COMM = COMMERCIALISTA_ANNUO / 12;

let transazioni = [];

document.addEventListener('DOMContentLoaded', () => {
    const datiSalvati = localStorage.getItem('dati_rui_finanza');
    if (datiSalvati) {
        transazioni = JSON.parse(datiSalvati);
        aggiornaTutto();
    }
    document.getElementById('inputData').valueAsDate = new Date();
});

// --- FUNZIONI DI INPUT ---
function calcolaProvvigione() {
    const premio = parseFloat(document.getElementById('inputPremio').value);
    const perc = parseFloat(document.getElementById('inputPerc').value);
    if (!isNaN(premio) && !isNaN(perc)) {
        document.getElementById('inputImporto').value = (premio * (perc / 100)).toFixed(2);
    }
}

function gestisciTipo() {
    const tipo = document.getElementById('inputTipo').value;
    const boxCalcolo = document.getElementById('boxCalcolo');
    if (tipo === 'uscita') {
        boxCalcolo.classList.add('hidden');
        document.getElementById('inputImporto').style.background = "white";
    } else {
        boxCalcolo.classList.remove('hidden');
        document.getElementById('inputImporto').style.background = "#f0fff4";
    }
}

function aggiungiTransazione() {
    const data = document.getElementById('inputData').value; // YYYY-MM-DD
    const desc = document.getElementById('inputDesc').value;
    const importo = parseFloat(document.getElementById('inputImporto').value);
    const tipo = document.getElementById('inputTipo').value;
    const premio = document.getElementById('inputPremio').value;
    const perc = document.getElementById('inputPerc').value;

    if (!data || !desc || isNaN(importo)) {
        alert("Dati mancanti!");
        return;
    }

    transazioni.push({
        id: Date.now(),
        data: data,
        descrizione: desc,
        importo: importo,
        tipo: tipo,
        dettaglioPremio: (tipo === 'entrata' && premio) ? premio : null,
        dettaglioPerc: (tipo === 'entrata' && perc) ? perc : null
    });

    salvaDati();
    aggiornaTutto();
    pulisciCampi();
}

function pulisciCampi() {
    document.getElementById('inputDesc').value = '';
    document.getElementById('inputImporto').value = '';
    document.getElementById('inputPremio').value = '';
    document.getElementById('inputPerc').value = '';
}

function elimina(id) {
    if (confirm("Sei sicuro di voler eliminare questa voce?")) {
        transazioni = transazioni.filter(t => t.id !== id);
        salvaDati();
        aggiornaTutto();
    }
}

function salvaDati() {
    localStorage.setItem('dati_rui_finanza', JSON.stringify(transazioni));
}

function aggiornaTutto() {
    aggiornaTabellaMovimenti();
    generareReportMensile();
}

// --- LOGICA REPORT MENSILE ---
function generareReportMensile() {
    const tbody = document.getElementById('tabellaReportBody');
    tbody.innerHTML = "";

    // 1. Raggruppiamo i dati per mese (Chiave: "2023-10")
    let report = {};

    transazioni.forEach(t => {
        const key = t.data.substring(0, 7); // Prende solo YYYY-MM
        if (!report[key]) {
            report[key] = { entrate: 0, uscite: 0 };
        }
        if (t.tipo === 'entrata') report[key].entrate += t.importo;
        else report[key].uscite += t.importo;
    });

    // 2. Ordinare i mesi dal più recente
    const mesiOrdinati = Object.keys(report).sort().reverse();

    // 3. Calcoli fiscali per ogni mese
    mesiOrdinati.forEach(meseKey => {
        const dati = report[meseKey];

        // Calcolo Tasse Variabili (sul fatturato del mese)
        const imponibile = dati.entrate * COEFF_REDDITIVITA;
        const tasseStato = imponibile * ALIQUOTA_IMPOSTA;

        // Costi Fissi (INPS + Commercialista)
        // Vengono tolti ogni mese INDIPENDENTEMENTE dal fatturato
        const costiFissiTotali = COSTO_MENSE_INPS + COSTO_MENSE_COMM;

        // Calcolo Netto
        // Netto = Entrate - (Uscite Reali + Tasse Stato + Quota INPS + Quota Comm)
        const netto = dati.entrate - dati.uscite - tasseStato - costiFissiTotali;

        // Formattazione data leggibile (es. "2023-10" -> "Ottobre 2023")
        const nomeMese = new Date(meseKey + "-01").toLocaleString('it-IT', { month: 'long', year: 'numeric' });

        // Creazione Riga Tabella
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:bold; text-transform:capitalize;">${nomeMese}</td>
            <td style="color:green;">€ ${dati.entrate.toFixed(2)}</td>
            <td style="color:red;">- € ${dati.uscite.toFixed(2)}</td>
            <td style="color:#d35400;">€ ${tasseStato.toFixed(2)}</td>
            <td style="color:#e67e22;">
                € ${costiFissiTotali.toFixed(2)} <br>
                <small style="font-size:0.7em; color:#666;">(INPS: ${COSTO_MENSE_INPS.toFixed(0)} + Comm: ${COSTO_MENSE_COMM.toFixed(0)})</small>
            </td>
            <td style="font-weight:bold; font-size:1.1em; color: ${netto >= 0 ? '#2e7d32' : 'red'};">
                € ${netto.toFixed(2)}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function aggiornaTabellaMovimenti() {
    const tbody = document.getElementById('tabellaBody');
    tbody.innerHTML = "";
    transazioni.sort((a, b) => new Date(b.data) - new Date(a.data));

    transazioni.forEach(t => {
        const tr = document.createElement('tr');
        const isEntrata = t.tipo === 'entrata';
        let dettagli = "-";
        if (t.dettaglioPremio) dettagli = `<small>Premio: €${t.dettaglioPremio} (${t.dettaglioPerc}%)</small>`;
        else if (!isEntrata) dettagli = "Spesa";

        tr.innerHTML = `
            <td>${t.data}</td>
            <td>${t.descrizione}</td>
            <td style="color:#777;">${dettagli}</td>
            <td style="font-weight:bold; color: ${isEntrata ? 'green' : 'red'}">
                ${isEntrata ? '+' : '-'} € ${t.importo.toFixed(2)}
            </td>
            <td><button onclick="elimina(${t.id})" style="background:red; color:white; border:none; border-radius:4px; cursor:pointer;">X</button></td>
        `;
        tbody.appendChild(tr);
    });
}