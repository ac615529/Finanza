// VARIABILI GLOBALI
let esami = [];
let agenda = {}; // Oggetto per salvare i task: { "YYYY-MM-DD": [tasks...] }
let dataCorrenteCal = new Date();
let dataSelezionata = null; // Il giorno cliccato dall'utente

document.addEventListener('DOMContentLoaded', () => {
    // Carica Esami
    const datiUni = localStorage.getItem('dati_universita');
    if (datiUni) esami = JSON.parse(datiUni);

    // Carica Agenda
    const datiAgenda = localStorage.getItem('dati_universita_agenda');
    if (datiAgenda) agenda = JSON.parse(datiAgenda);

    // Imposta oggi come default
    const oggi = new Date();
    selezionaGiorno(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());

    renderTutto();
});

// --- GESTIONE SALVATAGGIO ---
function salva() {
    localStorage.setItem('dati_universita', JSON.stringify(esami));
    localStorage.setItem('dati_universita_agenda', JSON.stringify(agenda));
    renderTutto();
}

function renderTutto() {
    renderListeEsami();
    renderStats();
    renderCalendario();
    renderAgenda(); // Aggiorna la vista dell'agenda
}

// --- LOGICA AGENDA (Nuova) ---

function selezionaGiorno(anno, mese, giorno) {
    // Crea stringa data YYYY-MM-DD
    const meseStr = String(mese + 1).padStart(2, '0');
    const giornoStr = String(giorno).padStart(2, '0');
    dataSelezionata = `${anno}-${meseStr}-${giornoStr}`;

    // Aggiorna titolo
    const dataOggi = new Date();
    const isOggi = (dataSelezionata === dataOggi.toISOString().split('T')[0]);
    document.getElementById('selectedDateDisplay').innerText = isOggi ? "Oggi" : `${giorno}/${meseStr}/${anno}`;

    renderAgenda();
    renderCalendario(); // Per aggiornare la selezione visiva
}

function aggiungiTask() {
    const testo = document.getElementById('taskInput').value;
    const materia = document.getElementById('taskMateria').value;

    if (!testo || !dataSelezionata) return;

    if (!agenda[dataSelezionata]) {
        agenda[dataSelezionata] = [];
    }

    agenda[dataSelezionata].push({
        id: Date.now(),
        testo: testo,
        materia: materia || 'Generico',
        fatto: false
    });

    document.getElementById('taskInput').value = '';
    document.getElementById('taskMateria').value = '';
    salva();
}

function toggleTask(dateKey, id) {
    const task = agenda[dateKey].find(t => t.id === id);
    if (task) {
        task.fatto = !task.fatto;
        salva();
    }
}

function eliminaTask(dateKey, id) {
    agenda[dateKey] = agenda[dateKey].filter(t => t.id !== id);
    // Se la lista è vuota, eliminiamo la chiave per pulizia
    if (agenda[dateKey].length === 0) delete agenda[dateKey];
    salva();
}

function renderAgenda() {
    const container = document.getElementById('todoList');
    container.innerHTML = '';

    const tasks = agenda[dataSelezionata] || [];

    if (tasks.length === 0) {
        container.innerHTML = `<p class="empty-msg">Niente pianificato per questa data.<br>Goditi il riposo o aggiungi un obiettivo!</p>`;
        return;
    }

    tasks.forEach(t => {
        const div = document.createElement('div');
        div.className = `task-item ${t.fatto ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="task-left" onclick="toggleTask('${dataSelezionata}', ${t.id})">
                <input type="checkbox" class="task-checkbox" ${t.fatto ? 'checked' : ''}>
                <div>
                    <span class="task-sub">${t.materia}</span>
                    <span class="task-text">${t.testo}</span>
                </div>
            </div>
            <button style="background:transparent; color:#e74c3c; width:auto; padding:5px;" onclick="eliminaTask('${dataSelezionata}', ${t.id})">✕</button>
        `;
        container.appendChild(div);
    });
}

// --- LOGICA CALENDARIO (Aggiornata con Pallini) ---
function cambiaMese(delta) {
    dataCorrenteCal.setMonth(dataCorrenteCal.getMonth() + delta);
    renderCalendario();
}

function renderCalendario() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const giorniSettimana = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    giorniSettimana.forEach(g => {
        const d = document.createElement('div');
        d.className = 'day-name'; d.innerText = g;
        grid.appendChild(d);
    });

    const anno = dataCorrenteCal.getFullYear();
    const mese = dataCorrenteCal.getMonth();

    const nomiMesi = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    document.getElementById('meseCorrente').innerText = `${nomiMesi[mese]} ${anno}`;

    const primoGiorno = new Date(anno, mese, 1).getDay();
    const startDay = primoGiorno === 0 ? 6 : primoGiorno - 1;
    const numGiorni = new Date(anno, mese + 1, 0).getDate();

    for (let i = 0; i < startDay; i++) grid.appendChild(document.createElement('div'));

    const oggi = new Date();

    for (let d = 1; d <= numGiorni; d++) {
        const cell = document.createElement('div');
        cell.className = 'day';
        cell.innerText = d;

        // Data Stringa YYYY-MM-DD
        const dataStr = `${anno}-${String(mese + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        // Highlight Oggi
        if (d === oggi.getDate() && mese === oggi.getMonth() && anno === oggi.getFullYear()) {
            cell.style.fontWeight = 'bold';
            cell.style.color = '#3498db';
        }

        // Highlight Selezione
        if (dataStr === dataSelezionata) {
            cell.classList.add('selected');
        }

        // Click Event
        cell.onclick = () => selezionaGiorno(anno, mese, d);

        // INDICATORI (Pallini)
        const hasExam = esami.some(e => e.data === dataStr && !e.passato);
        const hasStudy = agenda[dataStr] && agenda[dataStr].length > 0;

        if (hasExam || hasStudy) {
            const dots = document.createElement('div');
            dots.className = 'dots-container';
            if (hasExam) dots.innerHTML += `<div class="dot-exam" title="Esame"></div>`;
            if (hasStudy) dots.innerHTML += `<div class="dot-study" title="Studio Pianificato"></div>`;
            cell.appendChild(dots);
        }

        grid.appendChild(cell);
    }
}

// --- LOGICA ESAMI (Preservata) ---
function aggiungiEsame() {
    const nome = document.getElementById('inNome').value;
    const cfu = parseInt(document.getElementById('inCFU').value);
    const data = document.getElementById('inData').value;
    if (!nome || isNaN(cfu)) return;
    esami.push({ id: Date.now(), nome, cfu, data, passato: false, voto: null });
    document.getElementById('inNome').value = '';
    document.getElementById('inCFU').value = '';
    salva();
}

function promuovi(id) {
    const voto = parseInt(prompt("Voto (18-30):"));
    if (voto >= 18 && voto <= 31) {
        const e = esami.find(x => x.id === id);
        if (e) { e.passato = true; e.voto = voto; salva(); }
    }
}

function elimina(id) {
    if (confirm("Eliminare?")) { esami = esami.filter(x => x.id !== id); salva(); }
}

function renderListeEsami() {
    const futuriDiv = document.getElementById('listaFuturi');
    const passatiDiv = document.getElementById('listaPassati');
    futuriDiv.innerHTML = ''; passatiDiv.innerHTML = '';

    esami.sort((a, b) => (a.data && b.data) ? new Date(a.data) - new Date(b.data) : 0);

    esami.forEach(e => {
        const div = document.createElement('div');
        div.className = `exam-item ${e.passato ? 'done' : 'todo'}`;
        if (!e.passato) {
            div.innerHTML = `
                <div class="exam-details"><h4>${e.nome}</h4><small>${e.cfu} CFU • ${e.data || '?'}</small></div>
                <div><button onclick="promuovi(${e.id})">✔</button> <button onclick="elimina(${e.id})" style="background:#c0392b">X</button></div>`;
            futuriDiv.appendChild(div);
        } else {
            div.innerHTML = `<div class="exam-details"><h4>${e.nome}</h4><small>Voto: ${e.voto}</small></div>`;
            passatiDiv.appendChild(div);
        }
    });
}

function renderStats() {
    let totCFU = 0, somma = 0, count = 0;
    esami.forEach(e => { if (e.passato) { totCFU += e.cfu; somma += (e.voto > 30 ? 30 : e.voto) * e.cfu; count += e.cfu; } });
    const media = count > 0 ? (somma / count).toFixed(2) : "0.00";
    const base = ((media * 110) / 30).toFixed(1);
    document.getElementById('statMedia').innerText = media;
    document.getElementById('statBase').innerText = base;
    document.getElementById('labelCFU').innerText = `${totCFU} / 180 CFU`;
    document.getElementById('barLaurea').style.width = `${(totCFU / 180) * 100}%`;
}