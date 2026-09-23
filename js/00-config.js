"use strict";
/* ================================================================
   MEMOIRE VIVE - 00-config.js
   Tous les chiffres du jeu au meme endroit. Rien d'autre ici : pas de
   logique, pas de dessin. Quand une valeur se regle en jouant, c'est
   dans ce fichier qu'on vient la tourner.
   ================================================================ */

var VERSION = 3;
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
    OXY_PAR_CLONE: 0.62,
    EAU_PAR_CLONE: 0.35,   /* la perte NETTE : le reste est recycle en continu */
    /* LES DECHETS NE TOMBENT PLUS DU CIEL. Un corps salit LA SALLE OU IL SE
       TROUVE, et une salle qui tourne se salit toute seule. Rien n'arrive
       jamais directement dans la cuve a dechets : il faut que quelqu'un aille
       nettoyer pour que la crasse y descende - et c'est de la que le recyclage
       tire l'eau et la matiere. Negliger le menage, c'est se priver des deux. */
    SALIT_PAR_CLONE: 0.25,

    /* ---- ILS SE DEBROUILLENT SEULS ----
       Un clone epuise quitte son poste pour la salle de vie et y revient
       une fois repose ; un clone affame va manger et retourne travailler.
       On n'a pas a le leur dire : vous etes une voix dans les murs, pas un
       contremaitre. Le poste quitte est RETENU et rendu au retour. */
    FATIGUE_AUTO: 78,     /* au-dessus, il va se coucher de lui-meme */
    FATIGUE_REPRISE: 16,  /* en dessous, il retourne a son poste */
    FAIM_AUTO: 75,        /* au-dessus, il va manger */
    FAIM_RASSASIE: 22,    /* en dessous, il retourne a son poste */
    LITS: 4,              /* combien tiennent dans la salle de vie a la fois */

    /* ---- LA MARCHE, EN TEMPS DE JEU ----
       Capital : on se deplace en JOURS, pas en secondes reelles. Sinon, a
       x16, traverser le vaisseau coutait trois jours de faim et de fatigue,
       et l'equipage passait sa vie dans les coursives. En prime, la
       simulation ne depend plus de la vitesse d'affichage. */
    MARCHE: 950,          /* unites de plan parcourues par jour, en transit */
    AFFAIRE: 260,         /* la meme chose, mais en s'affairant sur place */
    PAUSE_TRAVAIL: 0.09,  /* duree d'un geste, en jours */
    PAUSE_OISIF: 0.30,
    PAUSE_REPOS: 0.55,

    /* ---- LES BESOINS ---- */
    FAIM_JOUR: 9,        /* la faim monte de tant par jour */
    FAIM_SEUIL_REPAS: 55, /* au-dela, un repas lui profite */
    FAIM_REPAS: 62,       /* ce qu'un repas retire a la faim */
    VIVRES_REPAS: 1,      /* ce qu'un repas coute */
    FAIM_CRITIQUE: 92,    /* au-dela, la sante tombe */

    FATIGUE_TRAVAIL: 5.5,  /* par jour a un poste */
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

    /* ---- LA SALETE ----
       Une salle qui tourne se salit, et une salle sale rend moins. Un clone
       envoye au NETTOYAGE la debarrasse et porte ce qu'il ramasse a la cuve
       a dechets, ou le recyclage en tirera de la matiere. */
    SALETE_JOUR: 0.20,     /* ce qu'une salle en marche se salit par jour */
    SALETE_ARRET: 0.08,
    SALETE_SEUIL: 40,     /* en dessous, la crasse ne coute rien : on a le temps */
    SALETE_MALUS: 0.30,   /* a 100 de salete, la salle rend 40 % de moins */
    NETTOIE_JOUR: 26,     /* points de salete retires par jour, a plein */
    SALETE_VERS_DECHETS: 0.45,  /* ce qu'un point de salete pese dans la cuve :
                               un passage de balai doit VALOIR le detour */

    /* ---- L'USURE ---- */
    USURE_JOUR: 0.35,
    USURE_TENUE: 0.32,   /* une salle ou quelqu'un travaille s'use tant de fois moins */     /* une salle en marche perd tant d'integrite par jour */
    USURE_ARRET: 0.06,    /* une salle en veille ne pourrit pas : elle attend */
    REPARE_JOUR: 11.0,    /* points d'integrite rendus par jour, a plein */
    REPARE_MAT: 0.18,     /* materiaux consommes par point d'integrite rendu */
    PANNE: 12,            /* sous cette integrite, la salle ne demarre plus */

    /* ---- L'INSALUBRITE ---- */
    DECHETS_SEUIL: 0.75,  /* part de la cuve au-dela de laquelle on tombe malade */

    /* ---- LA DECANTATION ---- */
    NAISSANCE_MAT: 80,   /* materiaux engages d'un coup */
    NAISSANCE_JOURS: 10,  /* duree de la cuve */

    /* ---- CE QUE L'EQUIPAGE DIT ----
       Ils ne savent pas qu'un esprit humain les dirige. Ils parlent a la
       machine, et la machine, c'est vous. Deux bulles au maximum a l'ecran. */
    BULLE_MAX: 2,
    BULLE_DUREE: 5.5,     /* secondes reelles */
    BULLE_INTER: 6.0,     /* delai avant d'essayer d'en sortir une autre */

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
        role: "Boit 2 eau par jour et rend 4 vivres et 9 oxygene. "
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
    ferme:     { cout: { eau: 2.0 },     rend: { vivres: 4.0, oxy: 9.0 } }
};

/* ================= LES ORDRES =================
   Un ordre vise TOUJOURS une salle : on prend quelqu'un sur le plan, on le
   lache dans une salle, et on choisit ce qu'il y fait. C'est la seule
   grammaire du jeu.                                                      */
var ORDRES = [
    { k: "travail",    n: "Travailler ici",
      d: "Tient un poste de la salle et la fait produire." },
    { k: "nettoyage",  n: "Nettoyer / recycler",
      d: "Retire la salete et la porte a la cuve a dechets." },
    { k: "reparation", n: "Reparer",
      d: "Rend de l'integrite. Consomme des materiaux." },
    { k: "defense",    n: "Defendre",
      d: "Reste dans la salle sans y travailler." },
    { k: "attaque",    n: "Attaquer",
      d: "S'en prend aux hostiles presents." }
];

/* ---- LES DEUX ORDRES QUI NE VISENT PAS UNE SALLE ---- */
var POSTES_LIBRES = [
    { k: "repos", n: "Repos", d: "Dort en salle de vie. La fatigue tombe vite." },
    { k: "libre", n: "Libre", d: "Erre dans les coursives. Ne produit rien." }
];

/* Quels ordres sont possibles dans cette salle, et pourquoi pas. */
function ordresPour(s) {
    var out = [], i, o, raison;
    for (i = 0; i < ORDRES.length; i++) {
        o = ORDRES[i];
        raison = null;
        if (s.verrouille) raison = "salle scellee";
        else if (o.k === "travail" && s.postes === 0) raison = "aucun poste ici";
        else if (o.k === "travail" && titulairesDe(s.id).length >= s.postes) raison = "postes pleins";
        else if (o.k === "nettoyage" && s.salete < 1) raison = "deja propre";
        else if (o.k === "reparation" && s.integrite > 99.5) raison = "rien a reparer";
        else if (o.k === "attaque") raison = "aucun hostile";
        out.push({ k: o.k, n: o.n, d: o.d, raison: raison });
    }
    return out;
}
