"use strict";
/* ================================================================
   MEMOIRE VIVE - 08-effets.js
   Ce qui rend la machine lisible d'un coup d'oeil, sans lire un chiffre :

   - LES TRAITS LUMINEUX. Chaque fois qu'une salle produit, un trait part
     d'elle, longe la coursive, descend le long du bord et va se jeter dans
     la jauge concernee. Ce qui se consomme fait le trajet inverse, en plus
     sombre. On voit donc le vaisseau respirer.
   - LES CHIFFRES QUI POPENT. Dans la salle au depart, sur la jauge a
     l'arrivee. Et en rouge sur la jauge quand une reserve pleine deborde :
     remplir une cuve pleine, c'est jeter ce qu'on vient de produire.
   - LES BULLES. L'equipage parle. Il ne sait pas qu'un esprit humain le
     dirige : il s'adresse a "la machine", qui est vous. Deux bulles au
     maximum, et un micro qu'on peut couper.

   Tout est purement visuel : rien ici ne touche a l'etat de la partie.
   ================================================================ */

var couche = null;          /* le calque par-dessus l'ecran */
var particules = [];
var flotteurs = [];
var reservoir = {};         /* ce qu'on a vu passer, en attente d'un trait */

var SEUIL_TRAIT = 1.4;      /* unites accumulees avant d'envoyer un trait */
var MAX_PARTICULES = 30;
var DUREE_TRAIT = 1.15;     /* secondes */

function initEffets() {
    couche = $("#effets");
    couche.innerHTML = "";
    particules = [];
    flotteurs = [];
    reservoir = {};
}

/* ---- PASSER DES COORDONNEES DU PLAN AUX PIXELS DE L'ECRAN ---- */
function planVersEcran(x, y) {
    if (!planSvg) return null;
    var r = planSvg.getBoundingClientRect();
    var t = $("#tube").getBoundingClientRect();
    return {
        x: r.left - t.left + (x / 564) * r.width,
        y: r.top - t.top + (y / 348) * r.height
    };
}

function centreSalle(id) {
    var s = salleParId(id);
    if (!s) return null;
    return planVersEcran(s.x + s.w / 2, s.y + s.h / 2);
}

function centreJauge(k) {
    var el = document.querySelector('#jauges .g[data-res="' + k + '"] .bar');
    if (!el) return null;
    var r = el.getBoundingClientRect();
    var t = $("#tube").getBoundingClientRect();
    return { x: r.left - t.left + r.width / 2, y: r.top - t.top + r.height / 2 };
}

/* ================= LES TRAITS =================
   Le trajet n'est pas une ligne droite : il longe la coursive, puis le bord
   de l'ecran, puis tombe dans la jauge. C'est plus long, et c'est le but -
   on suit la matiere des yeux. */
function lancerTrait(srcId, k, quantite) {
    if (particules.length >= MAX_PARTICULES) return;

    var arrivee = centreJauge(k);
    if (!arrivee) return;

    var depart;
    if (srcId === "bord" || !salleParId(srcId)) {
        var t = $("#tube").getBoundingClientRect();
        depart = { x: t.width / 2, y: t.height * 0.42 };
    } else {
        depart = centreSalle(srcId);
    }
    if (!depart) return;

    var positif = quantite > 0;
    var coursive = planVersEcran(282, CORR_Y);
    var yCoursive = coursive ? coursive.y : depart.y;

    /* les trois etapes : rejoindre la coursive, courir jusqu'au bon x,
       puis plonger dans la jauge */
    var pts = [
        depart,
        { x: depart.x, y: yCoursive },
        { x: arrivee.x, y: yCoursive },
        arrivee
    ];
    if (!positif) pts.reverse();

    var el = bal("div", "part" + (positif ? "" : " moins"));
    couche.appendChild(el);
    particules.push({ el: el, pts: pts, t: 0, dur: DUREE_TRAIT, res: k, q: quantite });
}

/* ---- UN CHIFFRE QUI MONTE ET S'EFFACE ----
   Deux chiffres nes au meme endroit se superposaient et devenaient
   illisibles : on les eparpille un peu, et on plafonne leur nombre. */
var _decalage = 0;
var MAX_POPS = 20;

function popChiffre(pos, txt, classe) {
    if (!pos || !couche) return;
    while (flotteurs.length >= MAX_POPS) {
        var vieux = flotteurs.shift();
        if (vieux.el.parentNode) vieux.el.parentNode.removeChild(vieux.el);
    }
    _decalage = (_decalage + 1) % 5;
    var dx = (_decalage - 2) * 19;
    var dy = (_decalage % 2) * 9;
    var el = bal("div", "pop " + (classe || ""), txt);
    el.style.left = (pos.x + dx) + "px";
    el.style.top = (pos.y + dy) + "px";
    couche.appendChild(el);
    flotteurs.push({ el: el, t: 0, dur: 1.6 });
}

/* ================= CE QUE DIT L'EQUIPAGE =================
   Trois registres. Ils ne savent pas a qui ils parlent : pour eux, c'est la
   machine qui repartit les vies. C'est tout le sel de la chose. */
var BANALITES = [
    "Je crois que j'ai reve d'une ville, cette nuit.",
    "On tourne en rond et on appelle ca un voyage.",
    "Quelqu'un se souvient du gout du sel ?",
    "J'ai compte les rivets de la coursive. Il y en a douze mille.",
    "Ma main connait des gestes que je n'ai jamais appris.",
    "On dit que la Terre etait bleue. Moi je n'ai vu que ce couloir.",
    "Ce matin j'ai pleure sans savoir pourquoi. Ca arrive.",
    "Je m'appelle comment, deja, quand personne ne m'appelle ?"
];

var INCOMPREHENSION = [
    "La machine nous deplace comme des pions. Elle sait ce qu'elle fait ?",
    "Pourquoi moi ici, et pas lui ? Il n'y a personne a qui demander.",
    "On obeit a un ordinateur. C'est ca, notre civilisation.",
    "Elle ne repond jamais. Elle affecte, c'est tout.",
    "Si elle se trompe, qui la corrige ?",
    "J'aimerais bien qu'on m'explique, une fois.",
    "On va tous crever pendant qu'un calculateur fait ses additions.",
    "Elle nous regarde. Je le sens. Mais elle ne nous voit pas."
];

var ADMIRATION = [
    "Tout tourne. Je ne sais pas comment elle fait.",
    "On mange, on dort, on respire. C'est deja enorme.",
    "La machine a bien reparti. Il faut lui reconnaitre ca.",
    "Le vaisseau chante, aujourd'hui.",
    "J'ai presque l'impression qu'on va y arriver.",
    "Elle nous a mis au bon endroit. Ca se sent dans les mains."
];

/* Quel registre, vu l'etat du bord ? */
function humeurDuBord() {
    var i, s;
    var res = V.res, cap = CFG.CAP;

    var manque = res.oxy < cap.oxy * 0.25 || res.vivres < cap.vivres * 0.15
              || res.eau < cap.eau * 0.15;
    var crasse = false, orpheline = false, cassee = false;
    for (i = 0; i < V.salles.length; i++) {
        s = V.salles[i];
        if (s.verrouille) continue;
        if (s.salete > 65) crasse = true;
        if (s.postes > 0 && !affectesA(s.id).length) orpheline = true;
        if (s.integrite < CFG.PANNE) cassee = true;
    }
    if (manque || crasse || orpheline || cassee) return "mal";

    var toutPlein = res.oxy > cap.oxy * 0.7 && res.vivres > cap.vivres * 0.5
                 && res.eau > cap.eau * 0.5;
    var toutPropre = true;
    for (i = 0; i < V.salles.length; i++) {
        s = V.salles[i];
        if (!s.verrouille && (s.salete > 35 || s.integrite < 55)) toutPropre = false;
    }
    if (toutPlein && toutPropre) return "bien";
    return "neutre";
}

function tenterBulle() {
    if (!V.micro) return;
    if (V.bulles.length >= CFG.BULLE_MAX) return;

    var eq = vivants();
    if (!eq.length) return;

    /* on ne fait pas parler deux fois le meme en meme temps */
    var pris = {}, i;
    for (i = 0; i < V.bulles.length; i++) pris[V.bulles[i].id] = true;
    var libres = eq.filter(function (c) { return !pris[c.id]; });
    if (!libres.length) return;

    var c = libres[Math.floor(rnd() * libres.length)];
    var humeur = humeurDuBord();
    var source = humeur === "mal" ? INCOMPREHENSION
               : (humeur === "bien" ? ADMIRATION : BANALITES);

    /* un clone mal en point rale, quoi qu'il arrive */
    if (c.moral < 32 || c.faim > 80 || c.fatigue > 88) source = INCOMPREHENSION;

    var el = bal("div", "bulle" + (humeur === "bien" ? " bien" : (humeur === "mal" ? " mal" : "")),
                 source[Math.floor(rnd() * source.length)]);
    couche.appendChild(el);
    V.bulles.push({ id: c.id, el: el, t: 0 });
}

/* ================= LA MISE A JOUR, UNE FOIS PAR IMAGE ================= */
function majEffets(dt) {
    if (!couche || etat !== "jeu") return;
    var i, k, src, q, pos;

    /* ---- vider le grand livre et decider des traits ---- */
    for (src in V.flux) if (Object.prototype.hasOwnProperty.call(V.flux, src)) {
        for (k in V.flux[src]) if (Object.prototype.hasOwnProperty.call(V.flux[src], k)) {
            var cle = src + "|" + k;
            reservoir[cle] = (reservoir[cle] || 0) + V.flux[src][k];
            if (Math.abs(reservoir[cle]) >= SEUIL_TRAIT) {
                q = reservoir[cle];
                reservoir[cle] = 0;
                lancerTrait(src, k, q);
                if (src !== "bord") {
                    pos = centreSalle(src);
                    if (pos) popChiffre({ x: pos.x, y: pos.y - 14 },
                        (q > 0 ? "+" : "") + nb(q), q > 0 ? "plus" : "moins");
                }
            }
        }
    }
    V.flux = {};

    /* ---- ce qui deborde d'une reserve pleine est perdu ---- */
    for (k in V.perte) if (Object.prototype.hasOwnProperty.call(V.perte, k)) {
        if (V.perte[k] >= 1) {
            pos = centreJauge(k);
            if (pos) popChiffre({ x: pos.x, y: pos.y - 16 },
                "−" + nb(V.perte[k]) + " perdu", "perdu");
            V.perte[k] = 0;
        }
    }

    /* ---- avancer les traits ---- */
    for (i = particules.length - 1; i >= 0; i--) {
        var p = particules[i];
        p.t += dt;
        var u = p.t / p.dur;
        if (u >= 1) {
            pos = p.pts[p.pts.length - 1];
            if (p.q > 0) {
                popChiffre({ x: pos.x, y: pos.y - 16 }, "+" + nb(p.q), "plus");
            }
            if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
            particules.splice(i, 1);
            continue;
        }
        /* trois segments d'egale duree */
        var seg = Math.min(2, Math.floor(u * 3));
        var v = (u * 3) - seg;
        var a = p.pts[seg], b = p.pts[seg + 1];
        p.el.style.transform = "translate(" + (a.x + (b.x - a.x) * v).toFixed(1) + "px,"
                             + (a.y + (b.y - a.y) * v).toFixed(1) + "px)";
        p.el.style.opacity = (u < 0.12 ? u / 0.12 : (u > 0.86 ? (1 - u) / 0.14 : 1)).toFixed(2);
    }

    /* ---- les chiffres montent et s'effacent ---- */
    for (i = flotteurs.length - 1; i >= 0; i--) {
        var f = flotteurs[i];
        f.t += dt;
        if (f.t >= f.dur) {
            if (f.el.parentNode) f.el.parentNode.removeChild(f.el);
            flotteurs.splice(i, 1);
            continue;
        }
        var w = f.t / f.dur;
        f.el.style.transform = "translateY(" + (-22 * w).toFixed(1) + "px)";
        f.el.style.opacity = (1 - w).toFixed(2);
    }

    /* ---- les bulles suivent leur point ---- */
    V.tBulle -= dt;
    if (V.tBulle <= 0) { V.tBulle = CFG.BULLE_INTER; tenterBulle(); }

    for (i = V.bulles.length - 1; i >= 0; i--) {
        var b2 = V.bulles[i];
        b2.t += dt;
        var c = cloneParId(b2.id);
        if (b2.t >= CFG.BULLE_DUREE || !c || !c.vivant || !V.micro) {
            if (b2.el.parentNode) b2.el.parentNode.removeChild(b2.el);
            V.bulles.splice(i, 1);
            continue;
        }
        pos = planVersEcran(c.x, c.y);
        if (pos) {
            b2.el.style.left = pos.x + "px";
            b2.el.style.top = (pos.y - 16) + "px";
        }
        var f2 = b2.t / CFG.BULLE_DUREE;
        b2.el.style.opacity = (f2 < 0.1 ? f2 / 0.1 : (f2 > 0.82 ? (1 - f2) / 0.18 : 1)).toFixed(2);
    }
}

/* ---- LE MICRO ---- */
function basculerMicro() {
    if (!V) return;
    V.micro = !V.micro;
    $("#micro").classList.toggle("on", V.micro);
    $("#micro").textContent = V.micro ? "MICRO" : "MUET";
    if (!V.micro) {
        while (V.bulles.length) {
            var b = V.bulles.pop();
            if (b.el.parentNode) b.el.parentNode.removeChild(b.el);
        }
    }
    logMsg(V.micro ? "Micros de coursive ouverts." : "Micros de coursive coupes.", "");
}
