"use strict";
/* ================================================================
   MEMOIRE VIVE - 07-boucle.js
   Le menu, la boucle a pas fixe, les raccourcis, et les deux fins.

   PAS FIXE : la simulation avance toujours par tranches de 1/60 de
   seconde, quelle que soit la machine. La vitesse x4 ne fait pas des
   pas quatre fois plus gros, elle en fait quatre fois plus : c'est ce
   qui evite qu'une partie acceleree ne se comporte autrement.
   ================================================================ */

var acc = 0;
var horloge = 0;
var dernier = 0;
var PAS_MAX = 900;   /* garde-fou : jamais plus de 900 pas dans une image */

function boot() {
    brancherTouches();
    brancherVitesse();
    $("#micro").addEventListener("click", basculerMicro);
    /* un clic ailleurs referme le petit menu d'ordres */
    window.addEventListener("mousedown", function (e) {
        if (menuOuvert && !menuOuvert.contains(e.target)) fermerMenu();
    }, true);
    montrerMenu();
    requestAnimationFrame(boucle);
}

/* ================= LE MENU ================= */
function montrerMenu() {
    etat = "menu";
    var ec = $("#ecran");
    ec.style.display = "flex";
    ec.innerHTML =
        '<div class="panneau">' +
        "<h1>Memoire Vive</h1>" +
        '<div class="ss">Arche Nadir &middot; v' + VERSION + "</div>" +
        "<p>La Terre est morte. Vous etes une conscience humaine enfermee dans " +
        "l'ordinateur du vaisseau. A bord, quatre clones decantes adultes, " +
        "chacun avec le corps et un souvenir d'un mort de la Terre.</p>" +
        "<p>Vous ne touchez rien. Vous affectez des postes. Neuf salles reclament " +
        "des bras, du courant et des reserves &mdash; et elles s'usent. Vous n'avez pas " +
        "assez de monde pour tout tenir : <b>choisir, c'est le jeu</b>.</p>" +
        '<button class="big" id="bnew">Nouvelle partie</button>' +
        '<div class="ss" style="margin-top:10px;">Espace : pause &middot; 1 2 3 : vitesse</div>' +
        "</div>";
    $("#bnew").addEventListener("click", function () { demarrer(); });
}

function demarrer(graine) {
    nouvellePartie(graine);
    $("#ecran").style.display = "none";
    construirePlan();
    initEffets();
    rafraichir();
    majJournal();
    acc = 0;
    dernier = 0;
}

/* ================= LA FIN ================= */
function finPartie(raison) {
    if (etat === "fin") return;
    etat = "fin";
    fermerMenu();
    V.fin = raison;
    V.vitesse = 0;

    var morts = V.clones.filter(function (c) { return !c.vivant; }).length;
    var ec = $("#ecran");
    ec.style.display = "flex";

    var titre, texte;
    if (raison === "relais") {
        titre = "Premier relais atteint";
        texte = "L'arche Nadir a franchi la distance. " + vivants().length +
                " vivants a bord, " + morts + " laisses derriere, en " +
                Math.floor(V.jour) + " jours.";
    } else {
        titre = "Extinction";
        texte = "Plus personne ne respire a bord. Le vaisseau continue tout seul, " +
                "eclaire, chauffe, vide. " + Math.floor(V.jour) + " jours auront suffi.";
    }

    ec.innerHTML =
        '<div class="panneau">' +
        "<h1>" + titre + "</h1>" +
        '<div class="ss">Jour ' + Math.floor(V.jour) + " &middot; graine " + V.graine + "</div>" +
        "<p>" + texte + "</p>" +
        '<div class="bilan">' +
        '<div><dt>Progression</dt><dd>' + pc(V.distance) + "</dd></div>" +
        '<div><dt>Vivants</dt><dd>' + vivants().length + "</dd></div>" +
        '<div><dt>Morts</dt><dd>' + morts + "</dd></div>" +
        '<div><dt>Jours</dt><dd>' + Math.floor(V.jour) + "</dd></div>" +
        "</div>" +
        '<button class="big" id="bnew">Relancer une arche</button>' +
        "</div>";
    $("#bnew").addEventListener("click", function () { demarrer(); });
}

/* ================= LA VITESSE ================= */
function setVitesse(v) {
    if (etat !== "jeu") return;
    V.vitesse = v;
    majBarre();
}

function brancherVitesse() {
    $$("#vit span").forEach(function (b) {
        b.addEventListener("click", function () {
            setVitesse(parseInt(b.dataset.v, 10));
        });
    });
}

function brancherTouches() {
    window.addEventListener("keydown", function (e) {
        if (etat !== "jeu") return;
        if (e.code === "Space") { e.preventDefault(); setVitesse(V.vitesse === 0 ? 1 : 0); }
        else if (e.key === "1") setVitesse(1);
        else if (e.key === "2") setVitesse(4);
        else if (e.key === "3") setVitesse(16);
    });
    window.addEventListener("blur", function () { if (etat === "jeu") setVitesse(0); });
}

/* ================= LA BOUCLE ================= */
function boucle(t) {
    requestAnimationFrame(boucle);
    if (!dernier) { dernier = t; return; }
    var dt = (t - dernier) / 1000;
    dernier = t;
    if (dt > 0.25) dt = 0.25;       /* onglet revenu au premier plan */

    if (etat !== "jeu" || !V) return;

    if (V.vitesse > 0) {
        acc += dt * V.vitesse;
        var n = 0;
        while (acc >= CFG.PAS && n < PAS_MAX) {
            simPas(CFG.PAS);
            acc -= CFG.PAS;
            n++;
            if (etat !== "jeu") { acc = 0; break; }
        }
        if (n >= PAS_MAX) acc = 0;
    }

    if (etat !== "jeu") return;

    /* ce qui bouge a chaque image */
    majPoints();
    majPlan();
    majBarre();
    majJauges();
    majEffets(dt);

    /* ce qui se relit quatre fois par seconde : inutile plus souvent,
       et cela laisse les clics passer */
    horloge += dt;
    if (horloge > 0.25) {
        horloge = 0;
        majCarte();
        majEquipage();
    }
}

window.addEventListener("DOMContentLoaded", boot);
