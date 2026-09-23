"use strict";
/* ================================================================
   MEMOIRE VIVE - 02-clones.js
   Fabriquer quelqu'un. Un clone n'est pas une unite : c'est le corps
   et le souvenir d'un mort de la Terre. Le souvenir n'est pas de la
   decoration - c'est lui qui donne ses competences de depart, donc ce
   a quoi il sera bon. On lit la carte, on comprend ou le mettre.
   ================================================================ */

/* Chaque metier d'avant porte un souvenir et penche vers des
   competences. mid = le milieu du tirage, ecart = l'amplitude. */
var VIES = [
    { metier: "soudeur",       souv: "avoir soude des coques dans un chantier naval, et du bruit que ca faisait",
      pousse: { mecanique: 78 } },
    { metier: "maraichere",    souv: "des tomates qui ne muerissaient pas assez vite, et d'une serre en plastique",
      pousse: { botanique: 80 } },
    { metier: "infirmier",     souv: "un couloir d'hopital la nuit, et du bruit des chariots",
      pousse: { medecine: 79 } },
    { metier: "chimiste",      souv: "une paillasse, une odeur d'ammoniaque, et d'un cahier a spirale",
      pousse: { chimie: 81 } },
    { metier: "officier",      souv: "avoir donne des ordres a des gens plus vieux, et de n'en avoir pas dormi",
      pousse: { commandement: 77 } },
    { metier: "garagiste",     souv: "un moteur ouvert sur un etabli, un dimanche, la radio allumee",
      pousse: { mecanique: 70, chimie: 40 } },
    { metier: "institutrice",  souv: "trente enfants qui se taisent d'un coup, et d'une craie cassee",
      pousse: { commandement: 62, medecine: 45 } },
    { metier: "boulanger",     souv: "s'etre leve a trois heures pendant vingt ans, et de la chaleur du four",
      pousse: { botanique: 55, chimie: 48 } },
    { metier: "marin",         souv: "une mer trop calme, et d'avoir eu peur pour la premiere fois",
      pousse: { mecanique: 58, commandement: 52 } },
    { metier: "pharmacienne",  souv: "un tiroir de boites blanches, et d'un client qui pleurait",
      pousse: { medecine: 72, chimie: 58 } },
    { metier: "eboueur",       souv: "une ville vide a cinq heures du matin, et que c'etait beau",
      pousse: { chimie: 60, mecanique: 50 } },
    { metier: "jardinier",     souv: "un parc municipal, et d'un banc qu'il repeignait chaque annee",
      pousse: { botanique: 74, mecanique: 38 } },
    { metier: "archiviste",    souv: "une salle sans fenetre, et de l'odeur du papier qui s'abime",
      pousse: { commandement: 48, medecine: 40 } },
    { metier: "plombiere",     souv: "des mains toujours froides, et d'une cave inondee",
      pousse: { mecanique: 68, chimie: 44 } },
    { metier: "veterinaire",   souv: "un chien qu'elle n'a pas pu sauver, et de l'avoir dit aux enfants",
      pousse: { medecine: 76, botanique: 46 } },
    { metier: "cuisinier",     souv: "un service de midi, les cris, et d'avoir aime ca",
      pousse: { botanique: 60, commandement: 44 } }
];

var PRENOMS = ["Ilse", "Tomas", "Nour", "Jun", "Sarah", "Mikhail", "Awa", "Elias",
    "Paloma", "Kenji", "Rosa", "Anton", "Lian", "Farid", "Greta", "Samuel",
    "Ines", "Oskar", "Maya", "Diego", "Hanne", "Youssef", "Vera", "Piotr"];

var NOMS = ["Wernicke", "Abreu", "Bakkali", "Watanabe", "Okonkwo", "Sorokina",
    "Almeida", "Lindqvist", "Ferreira", "Haddad", "Novak", "Castellan",
    "Bergmann", "Mwangi", "Duarte", "Rasmussen", "Iturbe", "Kovacs"];

var _prochainId = 1;
var _prenomsPris = {};

/* Deux clones du meme prenom dans un equipage de six, c'est illisible :
   on repioche tant qu'on peut, puis on laisse passer. */
function prenomLibre() {
    var i, p;
    for (i = 0; i < 12; i++) {
        p = pick(PRENOMS);
        if (!_prenomsPris[p]) { _prenomsPris[p] = true; return p; }
    }
    return pick(PRENOMS);
}

/* ---- FABRIQUER UN CLONE ----
   Toutes les competences partent basses ; la vie d'avant en releve une
   ou deux. Personne n'est bon partout : c'est ce qui force a choisir.
   metierVoulu sert aux quatre fondateurs, qu'on ne laisse pas au hasard. */
function faireClone(metierVoulu) {
    var vie = null, k;
    if (metierVoulu) {
        for (k = 0; k < VIES.length; k++) if (VIES[k].metier === metierVoulu) vie = VIES[k];
    }
    if (!vie) vie = pick(VIES);
    var comp = {};
    for (k = 0; k < COMPS.length; k++) {
        comp[COMPS[k].k] = rndInt(8, 34);
    }
    for (k in vie.pousse) if (Object.prototype.hasOwnProperty.call(vie.pousse, k)) {
        comp[k] = clamp(vie.pousse[k] + rndInt(-12, 12), 20, 96);
    }

    var c = {
        id: "c" + (_prochainId++),
        prenom: prenomLibre(),
        nom: pick(NOMS),
        matricule: "C-" + String(rndInt(100, 9999)).padStart(4, "0"),
        age: 20,
        metier: vie.metier,
        souvenir: vie.souv,
        comp: comp,

        sante: 100,
        fatigue: rndInt(4, 18),
        faim: rndInt(10, 30),
        moral: rndInt(58, 82),

        poste: { type: "libre", id: null },
        vivant: true,
        cause: null,

        /* position sur le plan, pour le point bleu */
        x: 0, y: 0, cx: 0, cy: 0, pause: 0, chemin: []
    };
    c.nomComplet = c.prenom + " " + c.nom;
    return c;
}

/* ---- L'ETAT D'UN CLONE, EN UN CHIFFRE ----
   Un clone affame, epuise ou demoralise travaille mal. Ce facteur
   multiplie sa competence : c'est par lui que la vie du bord se paie
   en production. */
function formeClone(c) {
    var f = (c.sante / 100);
    f *= (1 - c.fatigue / 210);
    f *= (0.70 + 0.30 * c.moral / 100);
    if (c.faim > 80) f *= 0.72;
    return clamp(f, 0, 1);
}

/* Ce qu'un clone vaut a un poste donne, entre 0 et 1. */
function rendementClone(c, compK) {
    if (!c.vivant) return 0;
    var base = compK ? (c.comp[compK] / 100) : 0.5;
    /* meme un incompetent fait avancer un peu les choses */
    return clamp((0.30 + 0.70 * base) * formeClone(c), 0, 1);
}

/* Comment il va, en un mot - pour la pastille des listes. */
function etatClone(c) {
    if (!c.vivant) return { k: "mort", n: "Mort" };
    if (c.sante < 30) return { k: "grave", n: "Mourant" };
    if (c.faim > CFG.FAIM_CRITIQUE) return { k: "grave", n: "Affame" };
    if (c.fatigue > CFG.FATIGUE_EPUISE) return { k: "grave", n: "Epuise" };
    if (c.sante < 60 || c.faim > 75 || c.fatigue > 78) return { k: "faible", n: "Mal en point" };
    if (c.moral < 35) return { k: "faible", n: "Abattu" };
    return { k: "ok", n: "Valide" };
}

/* Le nom du poste, tel qu'il s'affiche partout. */
function nomPoste(p) {
    if (!p || p.type === "libre") return "Libre";
    if (p.type === "entretien") return "Entretien";
    if (p.type === "repos") return "Repos";
    var s = salleParId(p.id);
    return s ? s.nom : "Libre";
}
