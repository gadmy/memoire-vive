"use strict";
/* ================================================================
   MEMOIRE VIVE - 03-etat.js
   V, l'etat de la partie. Tout ce que la simulation fait avancer et
   tout ce que l'ecran lit se trouve la-dedans, et nulle part ailleurs.
   Une partie entiere tient dans cet objet.
   ================================================================ */

var V = null;
var etat = "menu";   /* menu | jeu | fin */

function salleParId(id) {
    var i;
    for (i = 0; i < V.salles.length; i++) if (V.salles[i].id === id) return V.salles[i];
    return null;
}

function cloneParId(id) {
    var i;
    for (i = 0; i < V.clones.length; i++) if (V.clones[i].id === id) return V.clones[i];
    return null;
}

function vivants() {
    return V.clones.filter(function (c) { return c.vivant; });
}

/* ---- QUI TRAVAILLE DANS CETTE SALLE ----
   Seuls les "travail" comptent pour la production : un nettoyeur ou un
   reparateur est dans la salle sans en tenir un poste. */
function affectesA(id) {
    return vivants().filter(function (c) {
        return !c.auto && c.poste.type === "travail" && c.poste.id === id;
    });
}

/* Ceux A QUI la salle appartient, absents compris. C'est ce qu'il faut
   afficher : un dormeur n'a pas perdu son poste, il n'y est juste pas. */
function titulairesDe(id) {
    return vivants().filter(function (c) {
        return c.poste.type === "travail" && c.poste.id === id;
    });
}

/* Qui, dans cette salle, y fait tel ordre. */
function aLaSalle(id, type) {
    return vivants().filter(function (c) {
        return !c.auto && c.poste.type === type && c.poste.id === id;
    });
}

function auPoste(type) {
    return vivants().filter(function (c) { return c.poste.type === type; });
}

/* Ceux qu'on peut donner a une salle : tout ce qui ne travaille pas deja. */
function disponibles() {
    return vivants().filter(function (c) {
        return c.poste.type === "libre" || c.poste.type === "repos";
    });
}

/* ================= NOUVELLE PARTIE ================= */
function nouvellePartie(graine) {
    seed(graine === undefined ? (Date.now() & 0x7fffffff) : graine);

    V = {
        graine: GRAINE,
        tick: 0,
        jour: 0,          /* jours ecoules, avec les decimales */
        vitesse: 1,
        distance: 0,      /* progression vers le premier relais, en pour cent */

        res: {
            eau: CFG.DEPART.eau,
            oxy: CFG.DEPART.oxy,
            vivres: CFG.DEPART.vivres,
            mat: CFG.DEPART.mat,
            dechets: CFG.DEPART.dechets
        },
        /* l'energie n'est pas un stock : c'est un flux recalcule a chaque pas */
        energie: { produite: 0, demandee: 0 },

        salles: [],
        clones: [],
        decantation: null,   /* { reste: jours } quand une cuve tourne */

        journal: [],
        bulles: [],          /* les repliques affichees au-dessus des points */
        micro: true,         /* on entend l'equipage, ou non */
        tBulle: 0,
        /* le grand livre du pas : qui a produit ou consomme quoi. L'ecran le
           vide a chaque image pour lancer les traits lumineux et les chiffres. */
        flux: {},
        perte: {},           /* ce qui deborde d'une reserve pleine */
        selection: null,     /* { type:"salle"|"clone", id } */
        fin: null,           /* "relais" | "extinction" */
        alertes: {}
    };

    /* les salles, copiees depuis la table pour que la partie ait les siennes */
    var i, s, def;
    for (i = 0; i < SALLES.length; i++) {
        def = SALLES[i];
        s = {
            id: def.id, nom: def.nom, x: def.x, y: def.y, w: def.w, h: def.h,
            postes: def.postes, en: def.en, prio: def.prio, comp: def.comp,
            role: def.role, icone: def.icone, verrouille: !!def.verrouille,
            passive: !!def.passive,
            integrite: def.verrouille ? 100 : rndInt(82, 100),
            salete: 0,         /* 0 a 100 : une salle sale rend moins */
            enReel: 0,         /* l'energie reellement demandee, au prorata des postes tenus */
            part: 0,           /* la part de postes tenus, de 0 a 1 */
            active: false,     /* alimentee et en marche, calcule a chaque pas */
            rendement: 0,      /* entre 0 et postes */
            coupee: false      /* eteinte faute d'energie */
        };
        V.salles.push(s);
    }

    /* LES QUATRE FONDATEURS NE SONT PAS TIRES AU SORT. On a choisi qui
       reveiller en premier : un mecanicien, une maraichere, un chimiste et
       un officier - de quoi tenir le courant, la nourriture, l'eau et le
       cap. Tous les suivants, eux, sortent de la cuve au hasard. */
    _prenomsPris = {};
    var fondateurs = ["soudeur", "maraichere", "chimiste", "officier"];
    for (i = 0; i < fondateurs.length; i++) V.clones.push(faireClone(fondateurs[i]));

    /* Un depart viable, mais deja tendu : le courant suffit tout juste a la
       ferme, au controle et a la salle de vie. L'eau, elle, baisse - il
       faudra bien mettre quelqu'un au recyclage, donc le retirer d'ailleurs. */
    V.clones[0].poste = { type: "travail", id: "machines" };   /* le soudeur */
    V.clones[2].poste = { type: "travail", id: "machines" };   /* le chimiste */
    V.clones[1].poste = { type: "travail", id: "ferme" };      /* la maraichere */
    V.clones[3].poste = { type: "travail", id: "controle" };   /* l'officier */

    for (i = 0; i < V.clones.length; i++) placerAuPoste(V.clones[i], true);

    etat = "jeu";
    V.selection = { type: "salle", id: "machines" };
    V.flux = {}; V.perte = {};

    logMsg("L'arche Nadir sort de l'ombre de la Terre. Quatre corps decantes, "
         + "neuf salles, et personne pour les commander sinon vous.", "cap");
    return V;
}

/* ================= LE JOURNAL =================
   Court, date, et jamais plus de 60 lignes : c'est une main courante,
   pas une archive. */
function logMsg(txt, ton) {
    if (!V) return;
    V.journal.unshift({ j: Math.floor(V.jour), txt: txt, ton: ton || "" });
    if (V.journal.length > 60) V.journal.pop();
    if (typeof majJournal === "function") majJournal();
}

/* Une alerte ne se repete pas tous les pas : on la retient et on ne la
   redit que si la situation s'est retablie entre-temps. */
function alerte(cle, txt, ton) {
    if (V.alertes[cle]) return;
    V.alertes[cle] = true;
    logMsg(txt, ton || "mal");
}

function alerteLevee(cle) { V.alertes[cle] = false; }
