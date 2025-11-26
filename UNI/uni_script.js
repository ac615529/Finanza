let esami = [];

document.addEventListener('DOMContentLoaded', () => {
    const datiSalvati = localStorage.getItem('dati_universita');
    if (datiSalvati) esami = JSON.parse(datiSalvati);
    aggiornaInterfaccia();
});

function aggiungiEsame() {
    const nome = document.getElementById('inNome').value;
    const cfu = parseInt(document.getElementById('inCFU').value);
    const data = document.getElementById('inData').value;

    if (!nome || isNaN(cfu)) { alert("Inserisci Nome e CFU"); return; }

    esami.push({
        id: Date.now(),
        nome: nome,
        cfu: cfu,
        data: data,
        passato: false,
        voto: null
    });

    salvaEaggiorna();
    document.getElementById('inNome').value = '';
    document.getElementById('inCFU').value = '';
}

function promuoviEsame(id) {
    const votoStr = prompt("Complimenti! Che voto hai preso? (18-30)");
    const voto = parseInt(votoStr);

    if (!voto || voto < 18 || voto > 31) { alert("Voto non valido"); return; }

    const index = esami.findIndex(e => e.id === id);
    if (index !== -1) {
        esami[index].passato = true;
        esami[index].voto = voto;
        salvaEaggiorna();
    }
}

function eliminaEsame(id) {
    if (confirm("Eliminare?")) {
        esami = esami.filter(e => e.id !== id);
        salvaEaggiorna();
    }
}

function salvaEaggiorna() {
    localStorage.setItem('dati_universita', JSON.stringify(esami));
    aggiornaInterfaccia();
}

function aggiornaInterfaccia() {
    const divFuturi = document.getElementById('listaFuturi');
    const divPassati = document.getElementById('listaPassati');

    divFuturi.innerHTML = '';
    divPassati.innerHTML = '';

    let sommaVotiAritmetica = 0;
    let sommaVotiPonderata = 0;
    let sommaCFU = 0;
    let countEsami = 0;

    // Ordina: prima i futuri per data, poi i passati per data
    esami.sort((a, b) => new Date(a.data) - new Date(b.data));

    esami.forEach(e => {
        const div = document.createElement('div');

        if (!e.passato) {
            // RENDERING ESAME FUTURO
            div.className = 'exam-card todo';
            div.innerHTML = `
                <div class="exam-info">
                    <h4>${e.nome} (${e.cfu} CFU)</h4>
                    <p>📅 ${e.data ? e.data : 'Data da definire'}</p>
                </div>
                <div>
                    <button class="btn-pass" onclick="promuoviEsame(${e.id})">Superato</button>
                    <button style="background:red; font-size:0.8rem; padding:5px;" onclick="eliminaEsame(${e.id})">X</button>
                </div>
            `;
            divFuturi.appendChild(div);
        } else {
            // RENDERING ESAME PASSATO (LIBRETTO)
            div.className = 'exam-card done';
            let displayVoto = e.voto === 31 ? "30L" : e.voto;

            div.innerHTML = `
                <div class="exam-info">
                    <h4>${e.nome} (${e.cfu} CFU)</h4>
                    <p>Superato il: ${e.data}</p>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="voto-badge">${displayVoto}</span>
                    <button style="background:#e74c3c; font-size:0.8rem; padding:5px;" onclick="eliminaEsame(${e.id})">X</button>
                </div>
            `;
            divPassati.appendChild(div);

            // Calcoli Statistici
            let votoCalc = e.voto > 30 ? 30 : e.voto; // La lode statisticamente vale 30 o 31 a seconda ateneo, qui metto 30 per sicurezza
            sommaVotiAritmetica += votoCalc;
            sommaVotiPonderata += (votoCalc * e.cfu);
            sommaCFU += e.cfu;
            countEsami++;
        }
    });

    // Aggiornamento Stats in alto
    const mediaArit = countEsami > 0 ? (sommaVotiAritmetica / countEsami).toFixed(2) : "0.00";
    const mediaPond = sommaCFU > 0 ? (sommaVotiPonderata / sommaCFU).toFixed(2) : "0.00";
    const baseLaurea = ((parseFloat(mediaPond) * 110) / 30).toFixed(1); // Formula standard (Media * 11) / 3

    document.getElementById('statAritmetica').innerText = mediaArit;
    document.getElementById('statPonderata').innerText = mediaPond;
    document.getElementById('statCFU').innerText = sommaCFU;
    document.getElementById('statBaseLaurea').innerText = baseLaurea;
}