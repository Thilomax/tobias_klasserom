# Klasserom

Placer elever på pulter automatisk. Algoritmen prøver å unngå at de samme elevene havner i samme gruppe som sist.

## Kom i gang

### Krav

- [Node.js](https://nodejs.org) (versjon 18 eller nyere)

Sjekk om du har det installert:
```sh
node --version
```

### Start appen

```sh
cd /sti/til/tobias_klasserom
npm install
npm run dev
```

Åpne [http://localhost:5173](http://localhost:5173) i nettleseren.

---

## Bruk

### 1. Legg til elever
Skriv inn elevnavn i sidepanelet og trykk **Legg til** (eller Enter). Elevene kan ha for- og etternavn.

### 2. Fordel elever
Trykk **Fordel elever** øverst. Algoritmen bruker historikk til å unngå at samme elever sitter i gruppe igjen.

### 3. Juster manuelt
Etter fordeling kan du klikke to pulter for å **bytte elever** mellom dem.

Uten aktiv fordeling kan du **dra pulter** for å flytte dem rundt på skjermen.

### 4. Lagre økt
Trykk **Lagre økt** for å lagre plasseringen til historikken. Neste gang du fordeler elever, brukes historikken til å minimere gjentakelser.

### 5. Innstillinger (⚙)
Klikk tannhjulet øverst i sidepanelet for å endre:
- Antall rader per kolonne (standard: 5)
- Antall pulter per gruppe/bredde (standard: 3)

Standard oppsett: 2 kolonner × 5 rader × 3 pulter = **30 pulter, 10 grupper**.

---

## Som Mac-app (uten installasjon)

Du kan legge appen til i Dock som en Safari-webapp:

1. Start appen (`npm run dev`)
2. Åpne [http://localhost:5173](http://localhost:5173) i **Safari**
3. Gå til **Fil → Legg til i Dock…**
4. Gi den et navn, trykk **Legg til**

Appen vises nå i Dock og åpnes uten nettleser-chrome (nesten som en native app).

> **Merk:** Appen må kjøre (`npm run dev`) i bakgrunnen for at Dock-ikonet skal virke.

---

## Algoritmen

Seating-algoritmen bruker **simulert annealing**:
- Starter med en tilfeldig fordeling
- Gjør 12 000 byttesteg og aksepterer endringer som reduserer antall gjentakelser
- Holder styr på beste løsning underveis
- En «konflikt» er to elever som har sittet i samme gruppe tidligere

Data lagres lokalt i nettleserens `localStorage` — ingenting sendes noe sted.

---

## Oppsett av filer

```
src/
  App.jsx                  – Hoved-layout
  components/
    ClassroomCanvas.jsx    – Klikk- og drag-logikk for pulter
    Desk.jsx               – Enkelt pult-komponent
    StudentList.jsx        – Elevliste med legg til/fjern
    SessionHistory.jsx     – Historikk over tidligere økter
    SettingsModal.jsx      – Innstillinger for klasseromstørrelse
  hooks/
    useStore.js            – All state + localStorage-persistering
  utils/
    layout.js              – Beregner pult-posisjoner
    seating.js             – Setefordelingsalgoritmen
    storage.js             – localStorage-hjelper
```
