"use strict";
/* ================================================================
   MEMOIRE VIVE - 00-config.js
   Tous les chiffres du jeu au meme endroit. Rien d'autre ici : pas de
   logique, pas de dessin. Quand une valeur se regle en jouant, c'est
   dans ce fichier qu'on vient la tourner.
   ================================================================ */

var VERSION = 1;
document.title = "Memoire Vive v" + VERSION;

/* ---- LE TEMPS ----
   Le jeu compte en JOURS. Un jour dure SEC_PAR_JOUR secondes a la
   vitesse x1. La simulation avance a pas fixe : 60 pas par seconde,
   jamais plus, pour que deux parties de meme graine se ressemblent. */
var CFG = {
    SEC_PAR_JOUR: 18,
    PAS: 1 / 60,
    VITESSES: [0, 1, 4, 16],

    /* la cible de la tranche : le premier relais */
    RELAIS: 100,          /* en pour cent de progression */
    AVANCE_JOUR: 1.20,    /* progression par jour, moteur a plein rendement */

    /* ---- CE QUE CONSOMME UN VIVANT, PAR JOUR ---- */
    OXY_PAR_CLONE: 0.80,
    EAU_PAR_CLONE: 0.35,   /* la perte NETTE : le reste est recycle en continu */
    DECHET_PAR_CLONE: 0.18,
    DECHET_PAR_SALLE: 0.10,

    /* ---- LES BESOINS ---- */
    FAIM_JOUR: 14,        /* la faim monte de tant par jour */
    FAIM_SEUIL_REPAS: 55, /* au-dela, le clone va manger s'il le peut */
    FAIM_REPAS: 62,       /* ce qu'un repas retire a la faim */
    VIVRES_REPAS: 1,      /* ce qu'un repas coute */
    FAIM_CRITIQUE: 92,    /* au-dela, la sante tombe */

    FATIGUE_TRAVAIL: 6.5,  /* par jour a un poste */
    FATIGUE_LIBRE: 4,     /* par jour sans rien faire */
    FATIGUE_REPOS: -30,   /* par jour en salle de vie */
    FATIGUE_EPUISE: 96,   /* au-dela, le clone s'effondre */

    /* ---- LA SANTE ---- */
    SANTE_REGEN: 2.0,
    SANTE_FAIM: -6.0,
    SANTE_ASPHYXIE: -22.0,
    SANTE_INSALUBRE: -2.4,
    SANTE_EPUISEMENT: -4.0,

    /* ---- LE MORAL ---- */
    MORAL_REPOS: 4.0,
    MORAL_MALHEUR: -5.0,  /* faim, fatigue ou maladie */
    MORAL_DEUIL: -14,     /* d'un coup, a chaque mort */

    /* ---- L'USURE ---- */
    USURE_JOUR: 0.35,     /* une salle en marche perd tant d'integrite par jour */
    USURE_ARRET: 0.25,    /* une salle a l'arret s'abime aussi, plus lentement */
    REPARE_JOUR: 11.0,     /* ce qu'un clone a l'entretien rend par jour, a plein */
    PANNE: 12,            /* sous cette integrite, la salle ne demarre plus */

    /* ---- L'INSALUBRITE ---- */
    DECHETS_SEUIL: 0.75,  /* part de la cuve au-dela de laquelle on tombe malade */

    /* ---- LA DECANTATION ---- */
    NAISSANCE_MAT: 80,   /* materiaux engages d'un coup */
    NAISSANCE_JOURS: 10,  /* duree de la cuve */

    /* ---- LES RESERVES AU DEPART ---- */
    DEPART: { eau: 330, oxy: 280, vivres: 150, mat: 190, dechets: 12 },
    CAP:    { eau: 600, oxy: 500, vivres: 400, mat: 500, dechets: 320 }
};

/* ================= LES CINQ COMPETENCES =================
   Chaque salle en lit UNE. Un clone doue dans la bonne competence fait
   tourner la salle a plein ; un clone a cote de ses talents la fait
   tourner au ralenti. C'est tout l'interet d'affecter soi-meme. */
var COMPS = [
    { k: "mecanique",    n: "Mecanique" },
    { k: "botanique",    n: "Botanique" },
    { k: "chimie",       n: "Chimie" },
    { k: "medecine",     n: "Medecine" },
    { k: "commandement", n: "Commandement" }
];

/* ================= LA TABLE DES SALLES =================
   x, y, w, h sont les coordonnees du plan (repere 564 x 348).
   postes   : combien de clones peuvent y travailler.
   en       : energie demandee par jour quand la salle tourne.
   prio     : ordre de coupure. Plus le chiffre est BAS, plus la salle
              est sacrifiee tot quand l'energie manque. Le moteur tombe le
              premier - il ne fait qu'avancer ; la ferme tombe la derniere.
   comp     : la competence que la salle recompense.               */
var SALLES = [
    {
        id: "moteur", nom: "Moteur", x: 40, y: 42, w: 112, h: 100,
        postes: 1, en: 2.5, prio: 1, comp: "mecanique",
        role: "Pousse le vaisseau. Ne sert a rien si personne ne tient le controle.",
        icone: "moteur"
    },
    {
        id: "machines", nom: "Machines", x: 164, y: 42, w: 112, h: 100,
        postes: 2, en: 0, prio: 99, comp: "mecanique",
        role: "Produit toute l'energie du bord. 12 unites par jour et par poste tenu. "
            + "Un bon mecanicien seul suffit a demarrer ; deux ouvrent le reste.",
        icone: "machines"
    },
    {
        id: "recyclage", nom: "Recyclage", x: 288, y: 42, w: 112, h: 100,
        postes: 1, en: 1.5, prio: 4, comp: "chimie",
        role: "Rend 9 eau par jour en bouclant la boucle grise, et tire 3,5 "
            + "materiaux des 7 dechets qu'il broie. "
            + "Sans lui, la cuve deborde et l'air devient malsain.",
        icone: "recyclage"
    },
    {
        id: "ferme", nom: "Ferme", x: 412, y: 42, w: 112, h: 100,
        postes: 2, en: 2.0, prio: 5, comp: "botanique",
        role: "Boit 2 eau par jour et rend 4 vivres et 6 oxygene. "
            + "C'est elle qui fait respirer le bord.",
        icone: "ferme"
    },
    {
        id: "stockage", nom: "Stockage", x: 40, y: 188, w: 112, h: 100,
        postes: 0, en: 0, prio: 99, comp: null, passive: true,
        role: "Tient les reserves. Rien a y faire, tout y passe.",
        icone: "stockage"
    },
    {
        id: "vie", nom: "Salle de vie", x: 164, y: 188, w: 112, h: 100,
        postes: 0, en: 0, prio: 6, comp: null,
        role: "On y dort et on y mange. Elle ne se coupe jamais : le support de "
            + "vie tient sur sa propre pile, et c'est la seule chose a bord qui "
            + "ne depende pas des machines.",
        icone: "vie"
    },
    {
        id: "naissance", nom: "Naissance", x: 288, y: 188, w: 112, h: 100,
        postes: 1, en: 2.5, prio: 3, comp: "medecine",
        role: "Decante un corps neuf. " + CFG.NAISSANCE_MAT + " materiaux, "
            + CFG.NAISSANCE_JOURS + " jours, un poste tenu et du courant.",
        icone: "naissance"
    },
    {
        id: "controle", nom: "Controle", x: 412, y: 188, w: 112, h: 100,
        postes: 1, en: 1, prio: 2, comp: "commandement",
        role: "Tient le cap et menage le materiel. Sans lui le moteur pousse dans le vide.",
        icone: "controle"
    },
    {
        id: "sas", nom: "Sas", x: 420, y: 296, w: 96, h: 24,
        postes: 0, en: 0, prio: 99, comp: null, verrouille: true,
        role: "Scelle. Les sorties viendront plus tard.",
        icone: null
    }
];

/* ================= CE QUE PRODUIT CHAQUE SALLE =================
   Lu par la simulation, exprime PAR JOUR et A PLEIN RENDEMENT.
   Le rendement reel vaut entre 0 et le nombre de postes tenus. */
/* Le recyclage fait DEUX choses qui ne se limitent pas pareil :
   - l'eau vient de la boucle grise, elle tourne tant que la salle tourne ;
   - les materiaux viennent des dechets solides, donc s'il n'y a rien a
     broyer, il n'y a rien a en tirer.
   D'ou l'eau hors du plafond des dechets, dans la simulation. */
var RECETTES = {
    machines:  { rend: { energie: 12.0 } },
    recyclage: { cout: { dechets: 7.0 }, rend: { mat: 3.5, eau: 9.0 } },
    ferme:     { cout: { eau: 2.0 },     rend: { vivres: 4.0, oxy: 6.0 } }
};

/* ---- LES POSTES QUI NE SONT PAS DES SALLES ---- */
var POSTES_LIBRES = [
    { k: "entretien", n: "Entretien", d: "Repare en continu la salle la plus abimee." },
    { k: "repos",     n: "Repos",     d: "Dort en salle de vie. La fatigue tombe vite." },
    { k: "libre",     n: "Libre",     d: "Erre dans les coursives. Ne produit rien." }
];
