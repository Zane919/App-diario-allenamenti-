# Diario Allenamenti – installazione sul telefono

L'app è una PWA, come MacroTracking: si pubblica come sito web (gratis) e poi si installa dal telefono con Chrome,
come una vera app (icona nella Home, schermo intero, funziona offline).
Serve un indirizzo HTTPS solo per poterla installare. Dopo l'installazione l'app non ha bisogno di rete.
Non usa nessun account e non manda dati a nessun server.

## Opzione A – Netlify Drop (la più veloce, dal PC)
1. Decomprimi lo zip: ottieni la cartella `diario-allenamenti`.
2. Vai su https://app.netlify.com/drop e trascina dentro la cartella.
3. Crea/accedi a un account Netlify gratuito per tenere il sito online in modo permanente.
4. Copia l'indirizzo (es. https://nome-casuale.netlify.app).

## Opzione B – GitHub Pages
1. Crea un repository pubblico e carica tutti i file della cartella (index.html deve stare nella radice).
2. Settings → Pages → Branch `main` / cartella `/ (root)` → Save.
3. L'indirizzo sarà https://TUO-NOME.github.io/NOME-REPO/

## Installazione sul telefono
1. Apri l'indirizzo con **Chrome** sul telefono.
2. Menu ⋮ → **Installa app** (o "Aggiungi a schermata Home").

## Come si usa
- **Allenati**: scegli la sessione, scrivi carico e ripetizioni di ogni serie e spunta la serie fatta.
  L'app ti propone il carico dell'ultima volta. Con "Salva allenamento" finisce nello storico.
- **Progressi**: per ogni esercizio i grafici di carico massimo, ripetizioni medie per serie e numero di serie.
  Tocca un grafico per vedere i valori di una seduta.
- **Scheda**: cambia nome, serie, ripetizioni e recupero di ogni esercizio; aggiungi, elimina e riordina
  esercizi e sessioni. Lo storico dei carichi resta anche se elimini un esercizio.
- **Storico**: correggi o elimina un allenamento già salvato.

## Dati iniziali
Alla prima apertura l'app carica la scheda a 4 sessioni e i carichi del 26-30 ottobre dal tuo file Excel.
Dove nel file c'era solo il carico (panca, face pull, hip thrust, calf raise) le ripetizioni sono vuote.
Per i cluster set le ripetizioni sono il totale (3 set da 4 = 12).

## Aggiornamenti
Sostituisci i file sul sito: l'app si aggiorna da sola alla riapertura successiva.
I dati (scheda e allenamenti) restano nel telefono e non vengono toccati.

## Dati e backup
Tutto è salvato solo sul telefono. In Storico → "I tuoi dati" puoi esportare/importare un backup.
Se cancelli i dati di Chrome o disinstalli l'app, i dati si perdono: fai ogni tanto un backup.
