"use strict";
/* ================================================================
   MEMOIRE VIVE - 06-panneaux.js
   Tout ce qui se lit : la barre du haut, les reserves, la carte de
   droite, la liste d'equipage, le journal. Le principe des cartes :
   une image, une identite, des chiffres toujours dans le meme ordre,
   puis une phrase en francais qui dit le probleme.
   ================================================================ */

/* ---- LES VIGNETTES, DESSINEES AU TRAIT ----
   Elles se recolorent avec l'ecran : aucune image, que des chemins. */
var ICONES = {
    moteur: '<path d="M40 22 h56 l28 14 -28 14 h-56 z"/><path d="M40 28 h-18 M40 44 h-18"/>'
          + '<path d="M124 30 l20 -8 M124 42 l20 8 M124 36 h22"/>',
    machines: '<circle cx="66" cy="36" r="16"/><circle cx="66" cy="36" r="6"/>'
          + '<path d="M66 12 v8 M66 52 v8 M42 36 h8 M82 36 h8 M49 19 l6 6 M83 47 l6 6 M83 25 l6 -6 M49 53 l6 -6"/>'
          + '<path d="M100 20 h26 v32 h-26 z M108 20 v-6 M118 20 v-6"/>',
    recyclage: '<path d="M80 14 l16 26 h-32 z"/><path d="M52 58 l-10 -26 26 8 z"/>'
          + '<path d="M108 58 l10 -26 -26 8 z"/><path d="M62 58 h44"/>',
    ferme: '<path d="M14 58 h132 M14 58 v-20 q0 -22 66 -22 q66 0 66 22 v20"/>'
          + '<path d="M46 58 v-14 h22 v14 M92 58 v-14 h22 v14"/>'
          + '<path d="M52 44 v-7 M57 44 v-10 M62 44 v-7 M98 44 v-7 M103 44 v-10 M108 44 v-7"/>',
    stockage: '<path d="M30 58 h40 v-26 h-40 z M74 58 h40 v-26 h-40 z M52 30 h40 v-18 h-40 z"/>'
          + '<path d="M30 45 h40 M74 45 h40 M52 21 h40"/>',
    vie: '<path d="M26 54 h48 v-14 h-48 z M26 40 v-12 h14 v12"/>'
          + '<path d="M92 54 v-22 h40 v22 M92 40 h40"/><circle cx="112" cy="20" r="7"/>',
    naissance: '<path d="M62 14 h36 v46 h-36 z" /><path d="M62 24 h36 M62 50 h36"/>'
          + '<circle cx="80" cy="32" r="5"/><path d="M80 37 v9 M74 46 l6 -4 6 4"/>'
          + '<path d="M50 20 v34 M110 20 v34"/>',
    controle: '<path d="M32 16 h96 v32 h-96 z"/><path d="M42 26 h30 M42 34 h22 M88 26 h30 M88 34 h16"/>'
          + '<path d="M56 48 v8 h48 v-8"/><path d="M44 60 h72"/>'
};

function vignette(k) {
    if (!k || !ICONES[k]) return "";
    return '<svg viewBox="0 0 160 72" aria-hidden="true">'
         + '<g fill="none" stroke="var(--ink)" stroke-width="1.5" '
         + 'stroke-linecap="round" stroke-linejoin="round">' + ICONES[k] + "</g></svg>";
}

/* ---- UNE LIGNE CHIFFREE ---- */
function ligne(k, v, ton) {
    return '<div class="row"><span class="k">' + k + '</span>'
         + '<span class="v' + (ton ? " " + ton : "") + '">' + v + "</span></div>";
}

/* ---- UNE JAUGE SEGMENTEE ---- */
function jauge(nom, val, max, ton, cle) {
    var p = clamp(val / max * 100, 0, 100);
    return '<div class="g ' + (ton || "") + '" data-res="' + (cle || "") + '">'
         + '<div class="glab"><span>' + nom + "</span><b>" + Math.round(val) + "</b></div>"
         + '<div class="bar"><i style="width:' + p.toFixed(1) + '%"></i></div></div>';
}

/* ================= LA BARRE DU HAUT ================= */
function majBarre() {
    $("#jour").textContent = "Jour " + Math.floor(V.jour);
    $("#dist").textContent = "Relais " + pc(V.distance);
    $("#distb").style.width = clamp(V.distance, 0, 100).toFixed(1) + "%";

    var e = V.energie;
    var manque = e.demandee > e.produite + 0.01;
    var el = $("#nrj");
    el.textContent = "Energie " + nb(e.demandee) + " / " + nb(e.produite);
    el.className = "scr-meta" + (manque ? " mal" : "");

    $$("#vit span").forEach(function (b) {
        b.classList.toggle("on", parseInt(b.dataset.v, 10) === V.vitesse);
    });
}

/* ================= LES RESERVES ================= */
function majJauges() {
    var r = V.res, c = CFG.CAP;
    function ton(v, max) {
        var p = v / max;
        return p < 0.12 ? "crit" : (p < 0.3 ? "low" : "");
    }
    $("#jauges").innerHTML =
        jauge("Eau", r.eau, c.eau, ton(r.eau, c.eau), "eau") +
        jauge("Oxygene", r.oxy, c.oxy, ton(r.oxy, c.oxy), "oxy") +
        jauge("Vivres", r.vivres, c.vivres, ton(r.vivres, c.vivres), "vivres") +
        jauge("Materiaux", r.mat, c.mat, ton(r.mat, c.mat), "mat") +
        jauge("Dechets", r.dechets, c.dechets,
              (r.dechets / c.dechets) > CFG.DECHETS_SEUIL ? "crit" : "", "dechets");
}

/* ================= LA CARTE DE DROITE ================= */
function majCarte() {
    var hote = $("#carte");
    if (!V.selection) { hote.innerHTML = ""; return; }
    if (V.selection.type === "salle") carteSalle(hote, salleParId(V.selection.id));
    else carteClone(hote, cloneParId(V.selection.id));
}

function carteSalle(hote, s) {
    if (!s) { hote.innerHTML = ""; return; }

    var mot, ton = "";
    if (s.verrouille) { mot = "Scelle"; }
    else if (s.integrite < CFG.PANNE) { mot = "Hors service"; ton = "bad"; }
    else if (s.coupee) { mot = "Coupee, faute d'energie"; ton = "warn"; }
    else if (s.active) { mot = "En marche"; }
    else if (s.postes > 0) { mot = "Sans personnel"; ton = "warn"; }
    else { mot = "A l'arret"; ton = "warn"; }

    var h = '<div class="card">';
    if (s.icone) h += '<div class="card-img">' + vignette(s.icone) + "</div>";
    h += '<div class="card-hd"><div class="nm">' + s.nom + "</div>"
       + '<div class="sub">' + (s.comp ? nomComp(s.comp) : "Aucune competence") + "</div></div>";

    h += '<div class="card-bd">';
    h += ligne("Etat", mot, ton);
    h += ligne("Integrite", pc(s.integrite),
               s.integrite < CFG.PANNE ? "bad" : (s.integrite < 40 ? "warn" : ""));
    h += ligne("Proprete", pc(100 - s.salete),
               s.salete > 70 ? "bad" : (s.salete > 30 ? "warn" : ""));
    if (s.en > 0) h += ligne("Energie", nb(s.en) + " /j");
    if (s.postes > 0) {
        h += ligne("Postes", affectesA(s.id).length + " / " + s.postes,
                   affectesA(s.id).length ? "" : "warn");
        h += ligne("Rendement", nb(s.rendement * 100 / s.postes) + " %");
    }
    h += ligneProduction(s);
    h += "</div>";

    /* LES POSTES, NOMMES. Un poste vide se remplit d'un clic ; un poste
       tenu se libere d'un clic. On peut aussi glisser un point du plan. */
    var i, j, eq, autres, ordreK;
    if (s.postes > 0) {
        eq = affectesA(s.id);
        h += '<div class="card-bd" style="border-top:1px solid var(--line);">'
           + '<div class="k" style="margin-bottom:4px;">Postes de travail</div>';
        for (i = 0; i < s.postes; i++) {
            if (eq[i]) {
                h += '<div class="poste" data-lib="' + eq[i].id + '">'
                   + '<span class="pn">' + eq[i].nomComplet + "</span>"
                   + '<span class="px">retirer</span></div>';
            } else {
                h += '<div class="poste vide" data-vide="' + s.id + '">'
                   + '<span class="pn">Poste vide</span>'
                   + '<span class="px">affecter</span></div>';
            }
        }
        h += "</div>";
    }

    /* ceux qui sont dans la salle sans y tenir de poste */
    autres = "";
    for (j = 0; j < ORDRES.length; j++) {
        ordreK = ORDRES[j].k;
        if (ordreK === "travail") continue;
        eq = aLaSalle(s.id, ordreK);
        for (i = 0; i < eq.length; i++) {
            autres += '<div class="poste" data-lib="' + eq[i].id + '">'
                    + '<span class="pn">' + eq[i].nomComplet + "</span>"
                    + '<span class="px">' + ORDRES[j].n.split(" ")[0].toLowerCase() + "</span></div>";
        }
    }
    if (autres) {
        h += '<div class="card-bd" style="border-top:1px solid var(--line);">'
           + '<div class="k" style="margin-bottom:4px;">Aussi dans la salle</div>'
           + autres + "</div>";
    }

    if (s.id === "naissance") {
        h += '<div class="card-bd" style="border-top:1px solid var(--line);">';
        if (V.decantation) {
            h += ligne("Cuve en cours", Math.ceil(V.decantation.reste) + " j");
        } else {
            h += '<button id="bcuve" class="bt">Amorcer une cuve &mdash; '
               + CFG.NAISSANCE_MAT + " materiaux</button>";
        }
        h += "</div>";
    }

    h += '<div class="card-ft">' + s.role;
    if (s.integrite < CFG.PANNE) {
        h += "<br><br><b>Elle ne redemarrera pas seule.</b> Mettez quelqu'un a l'entretien.";
    }
    h += "</div></div>";

    hote.innerHTML = h;

    $$("#carte .poste[data-lib]").forEach(function (el) {
        el.addEventListener("click", function () {
            affecter(el.dataset.lib, "libre", null);
        });
    });
    $$("#carte .poste[data-vide]").forEach(function (el) {
        el.addEventListener("click", function (ev) {
            ouvrirChoixClone(el.dataset.vide, ev.clientX, ev.clientY);
        });
    });
    var b = $("#bcuve");
    if (b) b.addEventListener("click", function () {
        var err = lancerDecantation();
        if (err) logMsg(err, "mal");
        rafraichir();
    });
}

/* ================= QUI METTRE A CE POSTE ? =================
   Le menu montre ce que chacun vaut DANS CETTE SALLE : c'est la seule
   information qui compte au moment de choisir. */
function ouvrirChoixClone(salleId, ecx, ecy) {
    fermerMenu();
    var s = salleParId(salleId);
    if (!s) return;
    var libres = disponibles();
    libres.sort(function (a, b) {
        return rendementClone(b, s.comp) - rendementClone(a, s.comp);
    });

    var m = bal("div", "ordmenu");
    var h = '<div class="ordhd">Poste vide<span>' + s.nom + "</span></div>";
    if (!libres.length) {
        h += '<div class="ord no"><span class="on">Personne de libre</span>'
           + '<span class="od">Retirez quelqu\'un d\'une autre salle.</span></div>';
    }
    var i, c;
    for (i = 0; i < libres.length; i++) {
        c = libres[i];
        h += '<div class="ord" data-c="' + c.id + '">'
           + '<span class="on">' + c.nomComplet + "</span>"
           + '<span class="od">' + (s.comp ? nomComp(s.comp) + " " + c.comp[s.comp] : "polyvalent")
           + " &middot; rendement " + Math.round(rendementClone(c, s.comp) * 100) + " %</span></div>";
    }
    m.innerHTML = h;
    document.body.appendChild(m);
    var r = m.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(ecx + 8, window.innerWidth - r.width - 10)) + "px";
    m.style.top = Math.max(8, Math.min(ecy + 8, window.innerHeight - r.height - 10)) + "px";

    $$(".ordmenu .ord[data-c]").forEach(function (el) {
        el.addEventListener("click", function () {
            affecter(el.dataset.c, "travail", salleId);
            fermerMenu();
        });
    });
    menuOuvert = m;
}

function ligneProduction(s) {
    var h = "", r = RECETTES[s.id], k;
    if (!r) return "";
    var f = s.active ? s.rendement : 0;
    if (r.rend) for (k in r.rend) if (Object.prototype.hasOwnProperty.call(r.rend, k)) {
        h += ligne("Produit " + nomRes(k), signe(r.rend[k] * f) + " /j", f > 0 ? "" : "warn");
    }
    if (r.cout) for (k in r.cout) if (Object.prototype.hasOwnProperty.call(r.cout, k)) {
        h += ligne("Consomme " + nomRes(k), nb(r.cout[k] * f) + " /j");
    }
    return h;
}

function nomRes(k) {
    return { eau: "eau", oxy: "oxygene", vivres: "vivres", mat: "materiaux",
             dechets: "dechets", energie: "energie" }[k] || k;
}

function nomComp(k) {
    var i;
    for (i = 0; i < COMPS.length; i++) if (COMPS[i].k === k) return COMPS[i].n;
    return k;
}

function carteClone(hote, c) {
    if (!c) { hote.innerHTML = ""; return; }
    var e = etatClone(c), i;

    var h = '<div class="card">';
    h += '<div class="card-img">'
       + '<svg viewBox="0 0 160 72" aria-hidden="true">'
       + '<g fill="none" stroke="var(--ink)" stroke-width="1.5">'
       + '<circle cx="80" cy="22" r="10"/><path d="M80 32 v8 M60 68 q2 -21 20 -25 q18 4 20 25"/>'
       + '<path d="M62 49 l-9 13 M98 49 l9 13"/></g>'
       + '<g fill="none" stroke="var(--line)" stroke-width="1">'
       + '<path d="M20 10 h12 M20 10 v12 M140 10 h-12 M140 10 v12'
       + ' M20 62 h12 M20 62 v-12 M140 62 h-12 M140 62 v-12"/></g></svg></div>';

    h += '<div class="card-hd"><div class="nm">' + c.nomComplet + "</div>"
       + '<div class="sub">' + c.matricule + " &middot; " + Math.floor(c.age)
       + " ans &middot; " + c.metier + "</div></div>";

    h += '<div class="card-bd">';
    h += ligne("Etat", e.n, e.k === "grave" ? "bad" : (e.k === "faible" ? "warn" : ""));
    h += ligne("Poste", nomPoste(c.poste));
    h += ligne("Sante", pc(c.sante), c.sante < 40 ? "bad" : (c.sante < 70 ? "warn" : ""));
    h += ligne("Fatigue", pc(c.fatigue), c.fatigue > 85 ? "bad" : (c.fatigue > 60 ? "warn" : ""));
    h += ligne("Faim", pc(c.faim), c.faim > 85 ? "bad" : (c.faim > 60 ? "warn" : ""));
    h += ligne("Moral", pc(c.moral), c.moral < 30 ? "bad" : (c.moral < 50 ? "warn" : ""));
    h += "</div>";

    h += '<div class="card-bd" style="border-top:1px solid var(--line);">';
    for (i = 0; i < COMPS.length; i++) {
        h += '<div class="row"><span class="k">' + COMPS[i].n + "</span>"
           + '<span class="v">' + c.comp[COMPS[i].k] + "</span></div>";
    }
    h += "</div>";

    /* ---- L'AFFECTATION ----
       Le gros des ordres se donne EN GLISSANT le point sur une salle. Ici on
       garde les deux qui ne visent aucune salle, et de quoi le renvoyer. */
    h += '<div class="card-bd" style="border-top:1px solid var(--line);">'
       + '<div class="k" style="margin-bottom:4px;">Ordre</div>';
    for (i = 0; i < POSTES_LIBRES.length; i++) {
        var p = POSTES_LIBRES[i];
        var la = (c.poste.type === p.k);
        h += '<div class="poste choix' + (la ? " ici" : "") + '" data-type="' + p.k + '">'
           + '<span class="pn">' + p.n + "</span>"
           + '<span class="px">' + (la ? "en cours" : "&rarr;") + "</span></div>";
    }
    h += '<div class="astuce">Glissez son point sur une salle du plan pour lui '
       + "dire quoi y faire.</div></div>";

    h += '<div class="card-ft">Se souvient de ' + c.souvenir + ".</div></div>";

    hote.innerHTML = h;

    $$("#carte .poste[data-type]").forEach(function (el) {
        el.addEventListener("click", function () { affecter(c.id, el.dataset.type, null); });
    });
}

/* ================= LA LISTE D'EQUIPAGE ================= */
function majEquipage() {
    var eq = vivants(), h = "", i, c, e;
    $("#nbeq").textContent = eq.length + " a bord";
    for (i = 0; i < eq.length; i++) {
        c = eq[i];
        e = etatClone(c);
        var choisi = (V.selection && V.selection.type === "clone" && V.selection.id === c.id);
        h += '<div class="mini' + (choisi ? " sel" : "") + '" data-c="' + c.id + '">'
           + '<div class="mh"><i class="dotv ' + e.k + '"></i><div>'
           + '<div class="mn">' + c.prenom.charAt(0) + ". " + c.nom + "</div>"
           + '<div class="mp">' + nomPoste(c.poste) + "</div></div></div>"
           + '<div class="tri">'
           + '<div class="bar"><i style="width:' + c.sante.toFixed(0) + '%"></i></div>'
           + '<div class="bar"><i style="width:' + (100 - c.fatigue).toFixed(0) + '%"></i></div>'
           + '<div class="bar"><i style="width:' + (100 - c.faim).toFixed(0) + '%"></i></div>'
           + "</div></div>";
    }
    if (!eq.length) h = '<div class="vide-txt">Plus personne.</div>';
    $("#equipage").innerHTML = h;

    $$("#equipage .mini").forEach(function (el) {
        el.addEventListener("click", function () {
            V.selection = { type: "clone", id: el.dataset.c };
            rafraichir();
        });
    });
}

/* ================= LE JOURNAL ================= */
function majJournal() {
    var h = "", i, l;
    for (i = 0; i < V.journal.length && i < 30; i++) {
        l = V.journal[i];
        h += "<div><time>J" + l.j + "</time><span class=\"" + l.ton + "\">" + l.txt + "</span></div>";
    }
    $("#journal").innerHTML = h;
}

/* ================= TOUT REDESSINER =================
   Appele apres chaque geste du joueur. Les parties qui bougent seules
   (les points, les jauges) sont rafraichies par la boucle, pas ici. */
function rafraichir() {
    if (!V || etat !== "jeu") return;
    majBarre();
    majJauges();
    majCarte();
    majEquipage();
    majPlan();
}
