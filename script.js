document.addEventListener('DOMContentLoaded', () => {

    // --- PARTE 1: EFFETTI VISIVI (Hover Card) ---
    const cards = document.querySelectorAll(".card");

    cards.forEach((item) => {
        item.addEventListener("mouseover", () => {
            cards.forEach((el) => el.classList.remove("active"));
            item.classList.add("active");
        });
    });

    // --- PARTE 2: CARICAMENTO DATI ---

    // A. Carica Dati P.IVA
    const dataBiz = localStorage.getItem('dati_rui_finanza');
    if (dataBiz) {
        const transazioni = JSON.parse(dataBiz);
        // Filtriamo solo le entrate
        const fatturato = transazioni
            .filter(t => t.tipo === 'entrata')
            .reduce((acc, t) => acc + t.importo, 0);

        // Formattiamo il numero (es. 1.200 -> 1.2k per spazio, oppure intero)
        // Se il numero è troppo grande, usiamo "k"
        let displayFatturato = fatturato.toFixed(0);
        if (fatturato > 10000) {
            displayFatturato = (fatturato / 1000).toFixed(1) + "k";
        }

        document.getElementById('valorePiva').innerText = displayFatturato;
    }

    // B. Carica Dati Università
    const dataUni = localStorage.getItem('dati_universita');
    if (dataUni) {
        const esami = JSON.parse(dataUni);
        let sommaVotiPonderati = 0;
        let sommaCFU = 0;

        esami.forEach(e => {
            if (e.passato) {
                // Se è 30L conta come 30 nei calcoli standard, o 31 se preferisci
                let votoCalc = e.voto > 30 ? 30 : e.voto;
                sommaVotiPonderati += (votoCalc * e.cfu);
                sommaCFU += e.cfu;
            }
        });

        const media = sommaCFU > 0 ? (sommaVotiPonderati / sommaCFU).toFixed(1) : "0";
        document.getElementById('valoreUni').innerText = media;
    }

    // C. Carica Dati Personali (Ultimo mese disponibile o Totale)
    // Qui facciamo una stima semplice basata sull'ultimo saldo calcolato
    // Nota: Per avere il saldo esatto bisogna replicare la logica del file personale.js
    // Per ora mettiamo un placeholder o leggiamo l'ultimo movimento se esiste.
    const movimentiPers = localStorage.getItem('dati_personale_movimenti');
    if (movimentiPers) {
        // Per semplicità, qui mostro il numero di movimenti registrati o un testo
        // Se vuoi il saldo esatto, serve la logica complessa.
        // Facciamo una cosa visuale carina:
        document.getElementById('valorePersonale').innerText = "OK";
        document.getElementById('valorePersonale').style.fontSize = "2rem";
    }
});