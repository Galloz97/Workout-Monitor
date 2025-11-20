// Database completo esercizi italiani con descrizioni dettagliate
// Totale: 100 esercizi

export const EXERCISES_DATABASE = [
  {
    id: "squat",
    name: "Squat",
    equipment: "Bilanciere, gabbia squat",
    description: "Posizionati nella gabbia squat con i piedi alla larghezza delle spalle. Appoggia il bilanciere sulla parte superiore della schiena. Piega le ginocchia e i fianchi contemporaneamente, mantenendo il petto alto e la schiena dritta. Scendi fino a quando le cosce sono parallele al pavimento (o più in basso se flessibile). Spingi i talloni per tornare in posizione eretta. Mantieni il core contratto durante tutto il movimento.",
    muscles: ["Quadricipiti", "Glutei", "Femorali", "Core"],
    difficulty: "Media"
  },
  {
    id: "squat-bulgaro",
    name: "Squat bulgaro",
    equipment: "Panca, manubri",
    description: "Posizionati di fronte a una panca con una gamba dietro poggiata sul bordo. La gamba anteriore deve essere in avanti di circa 60cm. Scendi flettendo la gamba anteriore fino a quando il ginocchio posteriore sfiora il pavimento. La tibia anteriore deve rimanere quasi verticale. Spingi con il tallone anteriore per tornare in posizione eretta.",
    muscles: ["Quadricipiti", "Glutei", "Equilibrio"],
    difficulty: "Media-Alta"
  },
  {
    id: "squat-sumo",
    name: "Squat sumo",
    equipment: "Bilanciere, gabbia squat",
    description: "Posizionati con i piedi più larghi della larghezza delle spalle, con le punte rivolte verso l'esterno a 30-45 gradi. Appoggia il bilanciere sulla parte superiore della schiena. Mantieni il petto alto e scendi flettendo le ginocchia. Scendi il più in basso possibile mantenendo la schiena neutra. Questo squat enfatizza i glutei e gli adduttori.",
    muscles: ["Glutei", "Adduttori", "Quadricipiti"],
    difficulty: "Media"
  },
  {
    id: "front-squat",
    name: "Front squat",
    equipment: "Bilanciere, gabbia squat",
    description: "Posiziona il bilanciere all'altezza del collo/spalle, mantenendo i gomiti alti e paralleli. Mantieni il petto in alto e la schiena dritta. Scendi flettendo ginocchia e fianchi in modo controllato. Le ginocchia devono stare sopra i piedi. Spingi i talloni per risalire. Richiede più mobilità rispetto allo squat classico.",
    muscles: ["Quadricipiti", "Core", "Spalle"],
    difficulty: "Media-Alta"
  },
  {
    id: "panca-piana",
    name: "Panca piana",
    equipment: "Bilanciere, panca piana",
    description: "Sdraiati su una panca piana con i piedi appoggiati a terra. Afferra il bilanciere leggermente più largo della larghezza delle spalle. Abbassa il bilanciere verso il petto in modo controllato. Mantieni i gomiti a 45 gradi dal corpo. Spingi il bilanciere verso l'alto. Mantieni la schiena leggermente arcuata.",
    muscles: ["Petto", "Spalle", "Tricipiti"],
    difficulty: "Media"
  },
  {
    id: "panca-inclinata",
    name: "Panca inclinata",
    equipment: "Bilanciere, panca inclinata",
    description: "Regola la panca a 30-45 gradi. Afferra il bilanciere leggermente più largo della larghezza delle spalle. Abbassa il bilanciere verso la parte superiore del petto. Mantieni i gomiti a 45 gradi. Spingi verso l'alto. Enfatizza le fibre superiori del petto e i deltoidi anteriori.",
    muscles: ["Petto alto", "Deltoidi anteriori", "Tricipiti"],
    difficulty: "Media"
  },
  {
    id: "panca-declinata",
    name: "Panca declinata",
    equipment: "Bilanciere, panca declinata",
    description: "Regola la panca in posizione declinata. Fissati bene alla panca usando i supporti per i piedi. Abbassa il bilanciere verso la parte inferiore del petto. Spingi verso l'alto. Enfatizza la parte inferiore del petto.",
    muscles: ["Petto basso", "Tricipiti"],
    difficulty: "Media"
  },
  {
    id: "panca-manubri",
    name: "Panca con manubri",
    equipment: "Manubri, panca piana",
    description: "Sdraiati con i piedi appoggiati. Prendi un manubrio per mano. Spingi i manubri verso l'alto, stendendo completamente i gomiti. Abbassa in modo controllato. I manubri offrono maggiore libertà di movimento rispetto al bilanciere.",
    muscles: ["Petto", "Spalle", "Tricipiti"],
    difficulty: "Media"
  },
  {
    id: "stacco-terra",
    name: "Stacco da terra",
    equipment: "Bilanciere",
    description: "Posizionati con i piedi alla larghezza delle spalle. Afferra il bilanciere con le mani leggermente più larghe delle spalle. Abbassa i fianchi e alza il petto. Tira il bilanciere mantenendolo vicino al corpo. Estendi i fianchi e le ginocchia contemporaneamente. Finisci in posizione eretta.",
    muscles: ["Schiena bassa", "Glutei", "Gambe", "Trappezio"],
    difficulty: "Alta"
  },
  {
    id: "stacco-rumeno",
    name: "Stacco rumeno",
    equipment: "Bilanciere",
    description: "Posizionati con i piedi alla larghezza delle spalle, bilanciere davanti alle cosce. Mantieni leggera flessione alle ginocchia. Spingi i fianchi all'indietro, abbassando il bilanciere lungo le gambe. Mantieni la schiena dritta. Ritorna spingendo i fianchi in avanti.",
    muscles: ["Femorali", "Glutei", "Schiena bassa"],
    difficulty: "Media"
  },
  {
    id: "stacco-sumo",
    name: "Stacco sumo",
    equipment: "Bilanciere",
    description: "Posizionati con i piedi larghi, punte verso l'esterno. Afferra il bilanciere con le mani all'interno delle ginocchia. Tira verso l'alto mantenendo il bilanciere vicino al corpo. Riduce lo stress sulla schiena bassa.",
    muscles: ["Glutei", "Adduttori", "Gambe"],
    difficulty: "Media"
  },
  {
    id: "stacco-gambe-tese",
    name: "Stacco gambe tese",
    equipment: "Bilanciere o manubri",
    description: "Mantieni le gambe quasi dritte. Piega i fianchi portando il bilanciere verso i piedi. Mantieni la schiena dritta. Scendi fino a dove la flessibilità lo consente. Torna in posizione eretta.",
    muscles: ["Femorali", "Glutei", "Schiena bassa"],
    difficulty: "Media"
  },
  {
    id: "trazioni",
    name: "Trazioni",
    equipment: "Barra di trazione",
    description: "Appendi con presa poco più larga delle spalle, palmi in avanti. Tira verso l'alto portando il petto verso la barra. Scendi controllato. Mantieni il core contratto per evitare oscillazioni.",
    muscles: ["Dorsali", "Bicipiti", "Schiena"],
    difficulty: "Alta"
  },
  {
    id: "trazioni-presa-larga",
    name: "Trazioni presa larga",
    equipment: "Barra di trazione",
    description: "Appendi con presa molto larga, palmi in avanti. Tira portando il petto verso la barra. Enfatizza i dorsali laterali.",
    muscles: ["Dorsali", "Schiena lata"],
    difficulty: "Alta"
  },
  {
    id: "trazioni-presa-stretta",
    name: "Trazioni presa stretta",
    equipment: "Barra di trazione",
    description: "Appendi con presa stretta, palmi in avanti. Tira portando il mento sopra la barra. I gomiti stanno più vicini al corpo. Enfatizza i bicipiti.",
    muscles: ["Bicipiti", "Dorsali"],
    difficulty: "Alta"
  },
  {
    id: "chin-up",
    name: "Chin up",
    equipment: "Barra di trazione",
    description: "Appendi con presa stretta, palmi verso di te (supina). Tira portando il mento sopra la barra. Meno difficile delle trazioni tradizionali.",
    muscles: ["Bicipiti", "Dorsali"],
    difficulty: "Media-Alta"
  },
  {
    id: "piegamenti",
    name: "Piegamenti",
    equipment: "Nessuno",
    description: "Posizione planking con mani poco più larghe delle spalle. Corpo dritto. Abbassa flettendo i gomiti a 90 gradi. Spingi per tornare su. Mantieni il core contratto.",
    muscles: ["Petto", "Spalle", "Tricipiti", "Core"],
    difficulty: "Media"
  },
  {
    id: "push-up",
    name: "Push up",
    equipment: "Nessuno",
    description: "Stesso dei piegamenti. Corpo dritto, abbassa flettendo i gomiti. Spingi per tornare su. Varianti: sulle ginocchia, inclinati, declinati.",
    muscles: ["Petto", "Spalle", "Tricipiti"],
    difficulty: "Media"
  },
  {
    id: "dip-parallele",
    name: "Dip parallele",
    equipment: "Sbarra parallela",
    description: "Appendi tra due barre con braccia dritte. Abbassa flettendo i gomiti a 90 gradi. Spingi per tornare su. Mantieni il core contratto.",
    muscles: ["Tricipiti", "Petto", "Spalle"],
    difficulty: "Media-Alta"
  },
  {
    id: "rematore-bilanciere",
    name: "Rematore bilanciere",
    equipment: "Bilanciere",
    description: "Piedi alla larghezza delle spalle. Afferra il bilanciere, gambe leggermente piegate. Busto quasi parallelo al pavimento. Tira il bilanciere verso l'addome, gomiti vicini al corpo.",
    muscles: ["Dorsali", "Schiena", "Bicipiti"],
    difficulty: "Media"
  },
  {
    id: "rematore-manubrio",
    name: "Rematore manubrio",
    equipment: "Manubri, panca",
    description: "Ginocchio e mano sulla panca, altro piede a terra. Tira il manubrio verso l'alto, gomito vicino al corpo. Esegui tutte le ripetizioni, poi cambia lato.",
    muscles: ["Dorsali", "Schiena", "Bicipiti"],
    difficulty: "Media"
  },
  {
    id: "rematore-t-bar",
    name: "Rematore T-bar",
    equipment: "T-bar, bilanciere",
    description: "Posizionati sopra il bilanciere. Mani sulla maniglia a T. Gambe leggermente piegate. Tira verso il petto mantenendo la schiena dritta.",
    muscles: ["Dorsali", "Schiena", "Bicipiti"],
    difficulty: "Media"
  },
  {
    id: "rematore-cavi",
    name: "Rematore cavi",
    equipment: "Macchina per i cavi",
    description: "Siediti con piedi sulla piastra. Afferra la maniglia. Schiena dritta, tira verso il petto. Scendi controllato.",
    muscles: ["Dorsali", "Schiena", "Bicipiti"],
    difficulty: "Media"
  },
  {
    id: "lento-avanti",
    name: "Lento avanti",
    equipment: "Bilanciere",
    description: "In piedi, bilanciere all'altezza delle spalle. Pressa verso l'alto estendendo i gomiti. Scendi controllato. Mantieni il core contratto.",
    muscles: ["Spalle", "Tricipiti", "Petto"],
    difficulty: "Media"
  },
  {
    id: "military-press",
    name: "Military press",
    equipment: "Bilanciere",
    description: "In piedi, bilanciere all'altezza del mento. Pressa verso l'alto in linea retta. Estendi i gomiti senza bloccarli. Mantieni il core contratto.",
    muscles: ["Spalle", "Tricipiti"],
    difficulty: "Media"
  },
  {
    id: "arnold-press",
    name: "Arnold press",
    equipment: "Manubri",
    description: "Seduto, manubri alle spalle con palmi verso di te. Premi verso l'alto ruotando i palmi verso l'esterno. Estendi i gomiti. Inverti il movimento. Lavora le spalle a 360 gradi.",
    muscles: ["Spalle", "Tricipiti"],
    difficulty: "Media"
  },
  {
    id: "push-press",
    name: "Push press",
    equipment: "Bilanciere",
    description: "Bilanciere alle spalle. Piega le ginocchia per generare potenza. Estendi gambe e pressa il bilanciere verso l'alto contemporaneamente.",
    muscles: ["Spalle", "Gambe", "Tricipiti"],
    difficulty: "Media-Alta"
  },
  {
    id: "leg-press",
    name: "Leg press",
    equipment: "Macchina leg press",
    description: "Siediti con schiena appoggiata. Piedi sulla piattaforma. Abbassa flettendo le ginocchia a 90 gradi. Spingi estendendo le gambe. Evita il blocco completo.",
    muscles: ["Quadricipiti", "Glutei", "Femorali"],
    difficulty: "Media"
  },
  {
    id: "leg-extension",
    name: "Leg extension",
    equipment: "Macchina leg extension",
    description: "Siediti con ginocchia piegate a 90 gradi. Estendi le gambe verso l'alto. Contrai i quadricipiti. Scendi controllato.",
    muscles: ["Quadricipiti"],
    difficulty: "Facile"
  },
  {
    id: "leg-curl",
    name: "Leg curl",
    equipment: "Macchina leg curl sdraiata",
    description: "Sdraiato, gambe dritte, talloni sotto il rullo. Fletti le ginocchia avvicinando i talloni ai glutei. Contrai i femorali. Scendi controllato.",
    muscles: ["Femorali"],
    difficulty: "Facile"
  },
  {
    id: "leg-curl-piedi",
    name: "Leg curl in piedi",
    equipment: "Macchina leg curl in piedi",
    description: "In piedi, rullo dietro il tallone. Fletti la gamba avvicinando il tallone al gluteo. Contrai i femorali. Esegui tutte le ripetizioni, poi cambia gamba.",
    muscles: ["Femorali"],
    difficulty: "Media"
  },
  {
    id: "affondi",
    name: "Affondi",
    equipment: "Nessuno o manubri",
    description: "In piedi, fai un passo avanti. Abbassa flettendo entrambe le ginocchia a 90 gradi. Il ginocchio anteriore non deve superare la punta del piede. Spingi per tornare su.",
    muscles: ["Quadricipiti", "Glutei", "Equilibrio"],
    difficulty: "Media"
  },
  {
    id: "affondi-manubri",
    name: "Affondi con manubri",
    equipment: "Manubri",
    description: "Manubrio in ogni mano. Passo avanti, abbassa flettendo le ginocchia a 90 gradi. Ginocchio posteriore vicino al pavimento. Spingi per tornare su. Alterna le gambe.",
    muscles: ["Quadricipiti", "Glutei", "Equilibrio"],
    difficulty: "Media"
  },
  {
    id: "affondi-bulgari",
    name: "Affondi bulgari",
    equipment: "Panca, manubri",
    description: "Di fronte a panca, piede posteriore poggiato. Scendi flettendo la gamba anteriore. Ginocchio posteriore vicino al pavimento. Spingi per tornare su.",
    muscles: ["Quadricipiti", "Glutei"],
    difficulty: "Media"
  },
  {
    id: "affondi-camminati",
    name: "Affondi camminati",
    equipment: "Manubri",
    description: "Manubrio in ogni mano. Passo avanti, abbassa fino a ginocchio posteriore vicino al pavimento. Spingi in avanti con l'altra gamba. Continua camminando.",
    muscles: ["Quadricipiti", "Glutei", "Equilibrio"],
    difficulty: "Media"
  },
  {
    id: "croci-panca",
    name: "Croci panca",
    equipment: "Nessuno",
    description: "Sdraiato, braccia sopra il petto leggermente piegate. Abbassa le braccia di lato fino al livello della panca. Mantieni flessione ai gomiti. Riporta le braccia sopra il petto.",
    muscles: ["Petto"],
    difficulty: "Media"
  },
  {
    id: "croci-manubri",
    name: "Croci manubri",
    equipment: "Manubri, panca piana",
    description: "Sdraiato, manubri sopra il petto con gomiti leggermente piegati. Abbassa in arco fino al livello della panca. Sentirai allungamento nel petto. Riporta i manubri su.",
    muscles: ["Petto"],
    difficulty: "Media"
  },
  {
    id: "croci-cavi",
    name: "Croci ai cavi",
    equipment: "Macchina per i cavi",
    description: "Al centro della macchina, afferra le maniglie con braccia piegate. Tira le maniglie verso il centro incrociando le braccia. Pausa quando si incontrano. Torna controllato.",
    muscles: ["Petto"],
    difficulty: "Media"
  },
  {
    id: "cable-fly",
    name: "Cable fly",
    equipment: "Macchina per i cavi",
    description: "Al centro della macchina, braccia aperte a 90 gradi. Tira le maniglie verso il centro in movimento fluido. Pausa nella contrazione massima. Torna controllato.",
    muscles: ["Petto"],
    difficulty: "Media"
  },
  {
    id: "curl-bilanciere",
    name: "Curl bilanciere",
    equipment: "Bilanciere",
    description: "In piedi, afferra il bilanciere poco più largo delle spalle, palmi avanti. Gomiti vicini al corpo. Piega i gomiti sollevando verso il mento. Scendi controllato.",
    muscles: ["Bicipiti"],
    difficulty: "Facile-Media"
  },
  {
    id: "curl-manubri",
    name: "Curl manubri",
    equipment: "Manubri",
    description: "In piedi, manubrio in ogni mano, palmi avanti. Gomiti vicini al corpo. Piega i gomiti sollevando verso le spalle. Scendi controllato. Puoi alternare le braccia.",
    muscles: ["Bicipiti"],
    difficulty: "Facile-Media"
  },
  {
    id: "curl-martello",
    name: "Curl martello",
    equipment: "Manubri",
    description: "In piedi, manubri con presa neutra (palmi uno di fronte all'altro). Gomiti vicini al corpo. Piega i gomiti sollevando. Enfatizza il brachiale e brachioradiale.",
    muscles: ["Bicipiti", "Brachiale"],
    difficulty: "Facile-Media"
  },
  {
    id: "curl-concentrato",
    name: "Curl concentrato",
    equipment: "Manubrio",
    description: "Seduto, manubrio in una mano. Gomito appoggiato all'interno della coscia. Piega il gomito sollevando il manubrio. Scendi controllato. Isola completamente il bicipite.",
    muscles: ["Bicipiti"],
    difficulty: "Facile"
  },
  {
    id: "curl-cavi",
    name: "Curl cavi",
    equipment: "Macchina per i cavi",
    description: "Davanti alla macchina, maniglia a livello delle cosce. Gomiti vicini al corpo. Piega i gomiti portando la maniglia verso il mento. Scendi controllato.",
    muscles: ["Bicipiti"],
    difficulty: "Facile-Media"
  },
  {
    id: "french-press",
    name: "French press",
    equipment: "Bilanciere o EZ bar",
    description: "Seduto o in piedi, bilanciere sopra la testa con gomiti estesi. Abbassa dietro la testa flettendo i gomiti. Gomiti fissi e rivolti avanti. Estendi per tornare su.",
    muscles: ["Tricipiti"],
    difficulty: "Media"
  },
  {
    id: "pushdown-cavi",
    name: "Pushdown cavi",
    equipment: "Macchina per i cavi",
    description: "Davanti alla macchina con maniglia alta. Afferra con impugnatura in pronazione. Gomiti vicini al corpo. Spingi verso il basso estendendo i gomiti. Scendi controllato.",
    muscles: ["Tricipiti"],
    difficulty: "Facile-Media"
  },
  {
    id: "estensioni-tricipiti",
    name: "Estensioni tricipiti",
    equipment: "Manubri",
    description: "Seduto, manubrio sopra la testa con entrambe le mani. Abbassa dietro la testa flettendo i gomiti. Gomiti rivolti avanti e fissi. Estendi per tornare su.",
    muscles: ["Tricipiti"],
    difficulty: "Media"
  },
  {
    id: "kickback-tricipiti",
    name: "Kickback tricipiti",
    equipment: "Manubri",
    description: "Accanto a panca, ginocchio sulla panca. Manubrio nell'altra mano con gomito piegato a 90 gradi. Estendi il gomito indietro. Scendi controllato.",
    muscles: ["Tricipiti"],
    difficulty: "Facile-Media"
  },
  {
    id: "face-pull",
    name: "Face pull",
    equipment: "Macchina per i cavi",
    description: "Davanti alla macchina con corda alta. Afferra la corda. Tira verso il viso separando le estremità della corda verso le orecchie. Scendi controllato. Ottimo per la salute della spalla.",
    muscles: ["Spalle posteriori", "Schiena"],
    difficulty: "Facile-Media"
  },
  {
    id: "alzate-laterali",
    name: "Alzate laterali",
    equipment: "Manubri",
    description: "In piedi, manubri ai lati con palmi verso di te. Alza i manubri verso i lati fino all'altezza delle spalle. Leggera flessione ai gomiti. Scendi controllato. Enfatizza i deltoidi laterali.",
    muscles: ["Spalle"],
    difficulty: "Facile-Media"
  },
  {
    id: "alzate-frontali",
    name: "Alzate frontali",
    equipment: "Manubri",
    description: "In piedi, manubri davanti alle cosce con palmi verso il corpo. Alza i manubri davanti a te fino all'altezza delle spalle. Leggera flessione ai gomiti. Scendi controllato. Enfatizza i deltoidi anteriori.",
    muscles: ["Spalle anteriori"],
    difficulty: "Facile-Media"
  },
  {
    id: "alzate-posteriori",
    name: "Alzate posteriori",
    equipment: "Manubri",
    description: "In piedi leggermente flesso. Inclinati in avanti mantenendo schiena dritta. Alza le braccia verso i lati fino all'altezza delle spalle. Leggera flessione ai gomiti. Scendi controllato.",
    muscles: ["Spalle posteriori", "Schiena"],
    difficulty: "Facile-Media"
  },
  {
    id: "shrugs",
    name: "Shrugs",
    equipment: "Bilanciere o manubri",
    description: "In piedi, bilanciere o manubri davanti alle cosce. Alza le spalle verso le orecchie in movimento controllato. Raggiungi la massima altezza e pausa. Abbassa controllato. Lavora il trapezio.",
    muscles: ["Trapezio"],
    difficulty: "Facile"
  },
  {
    id: "tirate-mento",
    name: "Tirate al mento",
    equipment: "Bilanciere",
    description: "In piedi, afferra il bilanciere poco più largo delle spalle. Solleva verso il mento alzando i gomiti. I gomiti restano più alti del bilanciere. Scendi controllato.",
    muscles: ["Spalle", "Trapezio", "Bicipiti"],
    difficulty: "Media"
  },
  {
    id: "crunch",
    name: "Crunch",
    equipment: "Nessuno",
    description: "Sdraiato sulla schiena, ginocchia piegate, piedi appoggiati. Mani dietro la testa. Solleva il petto verso le ginocchia flettendo l'addome. Mantieni la posizione un secondo. Scendi controllato.",
    muscles: ["Addominali"],
    difficulty: "Facile"
  },
  {
    id: "crunch-inverso",
    name: "Crunch inverso",
    equipment: "Nessuno",
    description: "Sdraiato, ginocchia piegate a 90 gradi, cosce verticali. Solleva i fianchi verso il petto portando le ginocchia verso il mento. Mantieni la contrazione un secondo. Scendi controllato.",
    muscles: ["Addominali inferiori"],
    difficulty: "Facile-Media"
  },
  {
    id: "plank",
    name: "Plank",
    equipment: "Nessuno",
    description: "Posizione piegamento, mani sotto le spalle. Mantieni il corpo dritto come una tavola dal collo ai talloni. Contrai l'addome. Mantieni la posizione per il tempo desiderato.",
    muscles: ["Core", "Addominali"],
    difficulty: "Media"
  },
  {
    id: "plank-laterale",
    name: "Plank laterale",
    equipment: "Nessuno",
    description: "Sul lato del corpo con piedi impilati. Avambraccio sul pavimento, gomito sotto la spalla. Solleva i fianchi mantenendo il corpo dritto. Mantieni la posizione. Esegui da entrambi i lati.",
    muscles: ["Addominali laterali", "Core"],
    difficulty: "Media"
  },
  {
    id: "bicycle-crunch",
    name: "Bicycle crunch",
    equipment: "Nessuno",
    description: "Sdraiato, ginocchia piegate, piedi sollevati. Mani dietro la testa. Solleva il petto e porta il gomito sinistro verso il ginocchio destro, estendendo la gamba sinistra. Inverti portando gomito destro verso ginocchio sinistro. Continua alternando.",
    muscles: ["Addominali", "Obliqui"],
    difficulty: "Media"
  },
  {
    id: "russian-twist",
    name: "Russian twist",
    equipment: "Disco pesante",
    description: "Seduto con ginocchia piegate, piedi sollevati leggermente. Inclinati all'indietro mantenendo schiena dritta. Prendi un disco e ruota il busto verso sinistra toccando il pavimento. Ruota verso destra. Continua alternando.",
    muscles: ["Obliqui", "Addominali"],
    difficulty: "Media"
  },
  {
    id: "dead-bug",
    name: "Dead bug",
    equipment: "Nessuno",
    description: "Sdraiato, braccia estese verso il soffitto, gambe piegate a 90 gradi. Abbassa il braccio destro dietro la testa mentre estendi la gamba sinistra. Torna alla posizione iniziale e ripeti dal lato opposto.",
    muscles: ["Core", "Addominali"],
    difficulty: "Facile-Media"
  },
  {
    id: "mountain-climbers",
    name: "Mountain climbers",
    equipment: "Nessuno",
    description: "Posizione piegamento con braccia dritte. Porta il ginocchio sinistro verso il petto. Ritorna e porta il ginocchio destro verso il petto. Continua alternando velocemente. Ottimo per cardio e core.",
    muscles: ["Core", "Addominali", "Cardio"],
    difficulty: "Media"
  },
  {
    id: "hanging-leg-raise",
    name: "Hanging leg raise",
    equipment: "Barra di trazione",
    description: "Appendi alla barra con braccia dritte. Solleva le gambe davanti a te fino al livello del petto o superiore. Mantieni contrazione un secondo. Abbassa controllato. Evita oscillazioni.",
    muscles: ["Addominali inferiori", "Hip flessori"],
    difficulty: "Media-Alta"
  },
  {
    id: "pull-up",
    name: "Pull up",
    equipment: "Barra di trazione",
    description: "Appendi alla barra con presa in pronazione poco più larga delle spalle. Tira verso l'alto portando il mento sopra la barra. Scendi controllato.",
    muscles: ["Dorsali", "Bicipiti", "Schiena"],
    difficulty: "Alta"
  },
  {
    id: "lat-machine",
    name: "Lat machine",
    equipment: "Macchina lat pulldown",
    description: "Siediti con piedi sulla piastra. Afferra la maniglia poco più larga delle spalle, palmi avanti. Tira la maniglia verso il petto. Scendi controllato.",
    muscles: ["Dorsali", "Bicipiti"],
    difficulty: "Media"
  },
  {
    id: "lat-machine-presa-larga",
    name: "Lat machine presa larga",
    equipment: "Macchina lat pulldown",
    description: "Siediti sulla macchina. Afferra la maniglia con presa molto larga. Tira verso il petto. Enfatizza i dorsali laterali. Scendi controllato.",
    muscles: ["Dorsali", "Schiena"],
    difficulty: "Media"
  },
  {
    id: "lat-machine-presa-stretta",
    name: "Lat machine presa stretta",
    equipment: "Macchina lat pulldown",
    description: "Siediti sulla macchina. Afferra la maniglia con presa stretta. Tira verso il petto. Enfatizza i bicipiti. Scendi controllato.",
    muscles: ["Bicipiti", "Dorsali"],
    difficulty: "Media"
  },
  {
    id: "pulley-basso",
    name: "Pulley basso",
    equipment: "Macchina per i cavi",
    description: "Siediti con piedi sulla piastra. Afferra la maniglia all'altezza dei fianchi. Tira verso l'addome flettendo i gomiti. Schiena dritta. Scendi controllato.",
    muscles: ["Dorsali", "Bicipiti"],
    difficulty: "Media"
  },
  {
    id: "pulley-alto",
    name: "Pulley alto",
    equipment: "Macchina per i cavi",
    description: "Davanti alla macchina alta. Afferra la maniglia sopra la testa con gomiti piegati. Tira verso il petto flettendo i gomiti. Scendi controllato.",
    muscles: ["Dorsali", "Bicipiti"],
    difficulty: "Media"
  },
  {
    id: "fly-petto",
    name: "Fly petto",
    equipment: "Macchina pec fly",
    description: "Siediti con schiena a contatto con lo schienale. Afferra i mandrini. Sposta verso il centro del corpo. Leggera flessione ai gomiti. Scendi controllato.",
    muscles: ["Petto"],
    difficulty: "Media"
  },
  {
    id: "pec-deck",
    name: "Pec deck",
    equipment: "Macchina pec deck",
    description: "Siediti con schiena appoggiata. Afferra le maniglie con gomiti piegati a 90 gradi. Tira le maniglie verso il centro. Leggera flessione ai gomiti. Scendi controllato.",
    muscles: ["Petto"],
    difficulty: "Media"
  },
  {
    id: "hip-thrust",
    name: "Hip thrust",
    equipment: "Bilanciere, panca",
    description: "Schiena appoggiata a panca. Gambe piegate, piedi sul pavimento. Bilanciere sulle anche. Spingi i fianchi verso l'alto fino a corpo in linea retta dalle spalle alle ginocchia. Scendi controllato.",
    muscles: ["Glutei", "Femorali"],
    difficulty: "Media"
  },
  {
    id: "hip-thrust-bilanciere",
    name: "Hip thrust bilanciere",
    equipment: "Bilanciere, panca",
    description: "Come hip thrust standard ma con bilanciere per aggiungere resistenza. Schiena sulla panca, bilanciere sulle anche. Spingi i fianchi verso l'alto. Scendi controllato.",
    muscles: ["Glutei", "Femorali"],
    difficulty: "Media"
  },
  {
    id: "glute-bridge",
    name: "Glute bridge",
    equipment: "Nessuno o elastico",
    description: "Sdraiato sulla schiena, ginocchia piegate, piedi alla larghezza delle spalle. Spingi i fianchi verso l'alto contraendo i glutei. Corpo in linea retta dalle spalle alle ginocchia. Scendi controllato.",
    muscles: ["Glutei"],
    difficulty: "Facile-Media"
  },
  {
    id: "donkey-kicks",
    name: "Donkey kicks",
    equipment: "Nessuno o elastico",
    description: "A quattro zampe. Mantieni gamba flessa a 90 gradi. Sposta la gamba flessa verso l'alto e indietro contraendo i glutei. Raggiungi massima contrazione. Scendi controllato.",
    muscles: ["Glutei"],
    difficulty: "Media"
  },
  {
    id: "clamshell",
    name: "Clamshell",
    equipment: "Nessuno o elastico",
    description: "Sdraiato su un lato con gambe piegate. Piedi insieme. Solleva il ginocchio superiore verso il soffitto. Mantieni contrazione un secondo. Abbassa. Completa ripetizioni, poi cambia lato.",
    muscles: ["Glutei medii", "Adduttori"],
    difficulty: "Facile-Media"
  },
  {
    id: "fire-hydrant",
    name: "Fire hydrant",
    equipment: "Nessuno",
    description: "A quattro zampe. Solleva una gamba verso il lato come farebbe un cane. Gamba piegata a 90 gradi. Raggiungi altezza dell'anca. Scendi controllato. Completa ripetizioni, poi cambia.",
    muscles: ["Glutei medii"],
    difficulty: "Facile-Media"
  },
  {
    id: "calf-raise",
    name: "Calf raise",
    equipment: "Nessuno o bilanciere",
    description: "In piedi, piedi alla larghezza delle spalle. Sollevati sulle punte contraendo i polpacci. Raggiungi massima altezza. Scendi controllato. Puoi appoggiarti a un muro per equilibrio.",
    muscles: ["Polpacci"],
    difficulty: "Facile"
  },
  {
    id: "calf-seduto",
    name: "Calf seduto",
    equipment: "Macchina calf seduto",
    description: "Siediti sulla macchina. Ginocchia sotto il rullo. Solleva i talloni sollevandoti sulle punte. Raggiungi massima altezza. Scendi controllato. Enfatizza la porzione profonda del polpaccio.",
    muscles: ["Polpacci"],
    difficulty: "Facile"
  },
  {
    id: "box-jump",
    name: "Box jump",
    equipment: "Scatola o piattaforma",
    description: "Di fronte a scatola robusta. Accovacciati leggermente e salta in alto. Atterra in cima alla scatola con entrambi i piedi contemporaneamente. Scendi controllato o salta giù. Ottimo per potenza esplosiva.",
    muscles: ["Gambe", "Glutei", "Cardio"],
    difficulty: "Alta"
  },
  {
    id: "burpees",
    name: "Burpees",
    equipment: "Nessuno",
    description: "In piedi. Accovacciati e appoggia le mani sul pavimento. Salta indietro in posizione piegamento. Esegui piegamento. Salta in avanti tornando accovacciato. Salta in aria. Ripeti. Cardio e forza totale.",
    muscles: ["Full body", "Cardio"],
    difficulty: "Alta"
  },
  {
    id: "kettlebell-swing",
    name: "Kettlebell swing",
    equipment: "Kettlebell",
    description: "Piedi alla larghezza delle spalle. Kettlebell con entrambe le mani. Fletti i fianchi portando il kettlebell tra le gambe. Estendi rapidamente fianchi e ginocchia facendo oscillare il kettlebell fino all'altezza del petto. Ritorna.",
    muscles: ["Glutei", "Schiena", "Cardio"],
    difficulty: "Media-Alta"
  },
  {
    id: "thruster",
    name: "Thruster",
    equipment: "Bilanciere",
    description: "Bilanciere alle spalle come in squat. Accovacciati e mentre risali estendi spalle e gomiti per premere il bilanciere sopra la testa. Abbassa alle spalle. Ripeti. Esercizio completo di potenza.",
    muscles: ["Full body"],
    difficulty: "Alta"
  },
  {
    id: "clean",
    name: "Clean",
    equipment: "Bilanciere",
    description: "Bilanciere a terra. Afferra poco più largo delle spalle. Tira verso l'alto esplosivamente passando per uno shrug. Porta i gomiti sotto il bilanciere e catturalo alle spalle. Torna in posizione eretta.",
    muscles: ["Full body", "Potenza"],
    difficulty: "Alta"
  },
  {
    id: "snatch",
    name: "Snatch",
    equipment: "Bilanciere",
    description: "Come Clean ma bilanciere va sopra la testa in una mossa. Bilanciere a terra. Tira verso l'alto esplosivamente. Porta sopra la testa in una mossa. Squat per stabilizzare sopra la testa.",
    muscles: ["Full body", "Potenza"],
    difficulty: "Molto alta"
  },
  {
    id: "power-clean",
    name: "Power clean",
    equipment: "Bilanciere",
    description: "Come Clean ma senza squat completo. Tira il bilanciere verso l'alto esplosivamente. Cattura alle spalle con discesa minima. Torna ereto. Potenza pura.",
    muscles: ["Full body", "Potenza"],
    difficulty: "Alta"
  },
  {
    id: "overhead-squat",
    name: "Overhead squat",
    equipment: "Bilanciere",
    description: "Bilanciere sopra la testa con braccia dritte. Piedi alla larghezza delle spalle. Scendi in squat mantenendo il bilanciere sopra la testa e braccia dritte. Petto in alto, schiena dritta. Spingi per risalire.",
    muscles: ["Full body", "Spalle"],
    difficulty: "Molto alta"
  },
  {
    id: "goblet-squat",
    name: "Goblet squat",
    equipment: "Kettlebell o disco",
    description: "Kettlebell o disco contro il petto con entrambe le mani. Piedi alla larghezza delle spalle. Scendi in squat profondo. Schiena dritta, petto in alto. Spingi per risalire.",
    muscles: ["Quadricipiti", "Glutei"],
    difficulty: "Media"
  },
  {
    id: "farmer-walk",
    name: "Farmer walk",
    equipment: "Manubri o kettlebell",
    description: "Manubrio o kettlebell in ogni mano ai lati. Cammina in avanti mantenendo postura eretta. Presa salda, core contratto. Cammina per distanza desiderata. Ottimo per presa e core.",
    muscles: ["Trapezio", "Core", "Grip strength"],
    difficulty: "Media"
  },
  {
    id: "plank-to-pike",
    name: "Plank to pike",
    equipment: "Nessuno",
    description: "Posizione plank con braccia dritte. Solleva i fianchi verso il soffitto portando il corpo in V capovolta (pike). Ritorna in plank. Ripeti. Esercizio avanzato per addome.",
    muscles: ["Addominali", "Core"],
    difficulty: "Media-Alta"
  },
  {
    id: "ab-wheel-rollout",
    name: "Ab wheel rollout",
    equipment: "Ab wheel",
    description: "Inginocchiato, ab wheel con entrambe le mani. Rotola in avanti estendendo il corpo. Ferma all'estensione massima. Rotola indietro. Molto difficile per gli addominali.",
    muscles: ["Addominali", "Core"],
    difficulty: "Alta"
  },
  {
    id: "landmine-press",
    name: "Landmine press",
    equipment: "Landmine, bilanciere",
    description: "Di fronte a landmine con bilanciere a 45 gradi. Afferra l'estremità con entrambe le mani. Pressa verso l'alto in linea retta. Scendi controllato.",
    muscles: ["Spalle", "Tricipiti", "Petto"],
    difficulty: "Media"
  },
  {
    id: "landmine-row",
    name: "Landmine row",
    equipment: "Landmine, bilanciere",
    description: "Di fronte a landmine. Afferra l'estremità del bilanciere. Tira verso il petto mantenendo gomiti vicini al corpo. Scendi controllato. Ottimo esercizio composto per la schiena.",
    muscles: ["Schiena", "Dorsali", "Bicipiti"],
    difficulty: "Media"
  },
  {
    id: "good-morning",
    name: "Good morning",
    equipment: "Bilanciere",
    description: "Bilanciere sulla parte superiore della schiena come in squat. Gambe dritte o con leggera flessione. Piega i fianchi portando il busto verso il basso fino a parallelo. Schiena dritta. Torna ereto spingendo i fianchi avanti.",
    muscles: ["Femorali", "Glutei", "Schiena bassa"],
    difficulty: "Media-Alta"
  },
  {
    id: "hyperextension",
    name: "Hyperextension",
    equipment: "Macchina hyperextension",
    description: "Sulla macchina con fulcro all'altezza dell'anca. Corpo dritto inizialmente. Fletti i fianchi portando il busto verso il basso. Torna ereto contraendo la schiena bassa. Movimento controllato.",
    muscles: ["Schiena bassa", "Glutei"],
    difficulty: "Media"
  },
  {
    id: "nordic-curl",
    name: "Nordic curl",
    equipment: "Nessuno",
    description: "Inginocchiato con piedi ancorati sotto panca o assistito. Lentamente abbassa il corpo in avanti mantenendo corpo dritto. Resisti il più possibile usando i femorali. Usa le mani per aiutarti se necessario. Ritorna.",
    muscles: ["Femorali"],
    difficulty: "Molto alta"
  },
  {
    id: "pistol-squat",
    name: "Pistol squat",
    equipment: "Nessuno",
    description: "In piedi su una gamba. Estendi l'altra gamba davanti a te. Accovacciati sulla gamba di appoggio scendendo il più possibile. Mantieni equilibrio. Risali spingendo il tallone. Mobilità e forza monopodale avanzata.",
    muscles: ["Quadricipiti", "Glutei", "Equilibrio"],
    difficulty: "Molto alta"
  },
  {
    id: "panca-stretta",
    name: "Panca stretta",
    equipment: "Bilanciere, panca piana",
    description: "Sdraiato su panca. Afferra il bilanciere con presa molto stretta. Abbassa verso il petto. Spingi verso l'alto. La presa stretta enfatizza i tricipiti.",
    muscles: ["Tricipiti", "Petto"],
    difficulty: "Media"
  },
  {
    id: "dip-petto",
    name: "Dip petto",
    equipment: "Sbarra parallela",
    description: "Tra barre parallele. Inclina il corpo leggermente avanti durante la discesa. Abbassa flettendo i gomiti. Scendi fino a gomiti a livello delle spalle. Spingi per risalire. Il corpo inclinato enfatizza il petto.",
    muscles: ["Petto", "Spalle", "Tricipiti"],
    difficulty: "Media-Alta"
  },
  {
    id: "dip-tricipiti",
    name: "Dip tricipiti",
    equipment: "Sbarra parallela",
    description: "Tra barre parallele. Mantieni corpo dritto (non inclinato). Abbassa flettendo i gomiti. Scendi fino a gomiti a livello delle spalle. Spingi per risalire. Il corpo dritto enfatizza i tricipiti.",
    muscles: ["Tricipiti"],
    difficulty: "Media-Alta"
  }
];

// Lista semplice di nomi per compatibilità con exercisesList.js
export const EXERCISES_IT = EXERCISES_DATABASE.map(ex => ex.name);

// Funzione di ricerca avanzata con matching fuzzy
export function searchExercise(name) {
  if (!name) return null;
  
  const normalized = name.toLowerCase().trim();
  
  // 1. RICERCA ESATTA
  let found = EXERCISES_DATABASE.find(ex => 
    ex.name.toLowerCase() === normalized ||
    ex.id === normalized
  );
  
  if (found) return found;
  
  // 2. RICERCA PARZIALE - rimuovi parole comuni
  const commonWords = ['con', 'il', 'la', 'di', 'da', 'in', 'a', 'per', 'su', 'e', 'o', 'alla', 'al', 'dello', 'della', 'dei', 'degli'];
  const cleanQuery = normalized
    .split(' ')
    .filter(word => !commonWords.includes(word) && word.length > 2)
    .join(' ');
  
  found = EXERCISES_DATABASE.find(ex => {
    const cleanName = ex.name.toLowerCase()
      .split(' ')
      .filter(word => !commonWords.includes(word) && word.length > 2)
      .join(' ');
    return cleanName.includes(cleanQuery) || cleanQuery.includes(cleanName);
  });
  
  if (found) return found;
  
  // 3. RICERCA PER TUTTE LE PAROLE CHIAVE
  const keywords = cleanQuery.split(' ').filter(w => w.length > 2);
  found = EXERCISES_DATABASE.find(ex => {
    const exName = ex.name.toLowerCase();
    return keywords.length > 0 && keywords.every(keyword => exName.includes(keyword));
  });
  
  if (found) return found;
  
  // 4. RICERCA CON ALMENO UNA PAROLA CHIAVE SIGNIFICATIVA
  found = EXERCISES_DATABASE.find(ex => {
    const exName = ex.name.toLowerCase();
    return keywords.some(keyword => keyword.length > 3 && exName.includes(keyword));
  });
  
  if (found) return found;
  
  // 5. RICERCA PARZIALE INIZIALE (es: "panc" trova "panca")
  found = EXERCISES_DATABASE.find(ex => {
    const exName = ex.name.toLowerCase();
    return keywords.some(keyword => 
      keyword.length > 3 && exName.split(' ').some(word => word.startsWith(keyword))
    );
  });
  
  return found || null;
}

// Funzione per ottenere suggerimenti durante la digitazione
export function getExerciseSuggestions(query) {
  if (!query || query.length < 2) return [];
  
  const normalized = query.toLowerCase();
  const commonWords = ['con', 'il', 'la', 'di', 'da', 'in', 'a', 'per', 'su', 'e', 'o', 'alla', 'al'];
  
  const cleanQuery = normalized
    .split(' ')
    .filter(word => !commonWords.includes(word) && word.length > 1)
    .join(' ');
  
  // Cerca esercizi che contengono le parole chiave
  const results = EXERCISES_DATABASE
    .filter(ex => {
      const exName = ex.name.toLowerCase();
      const keywords = cleanQuery.split(' ');
      
      // Match esatto
      if (exName.includes(normalized)) return true;
      
      // Match parziale
      if (exName.includes(cleanQuery)) return true;
      
      // Match con parole chiave
      return keywords.some(word => word.length > 2 && exName.includes(word));
    })
    .sort((a, b) => {
      // Ordina per rilevanza: prima i match esatti, poi parziali
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      if (aName.startsWith(normalized)) return -1;
      if (bName.startsWith(normalized)) return 1;
      
      if (aName.includes(normalized)) return -1;
      if (bName.includes(normalized)) return 1;
      
      return 0;
    })
    .slice(0, 10);
  
  return results;
}
