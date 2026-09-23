"use strict";
/* ================================================================
   MEMOIRE VIVE - 05-plan.js
   Le plan du vaisseau, en SVG. Construit une fois au lancement de la
   partie, puis seulement rafraichi : on ne redessine jamais tout, on
   change des attributs. C'est ce qui permet de tenir 60 images par
   seconde sans canvas et de garder un texte net.
   ================================================================ */

var planSvg = null;
var planSalles = {};   /* id -> les noeuds a rafraichir */
var planPoints = {};   /* id de clone -> le cercle */
var couchePoints = null;
var HORLOGE = 0;   /* secondes reelles, pour les animations seulement */

function construirePlan() {
    var hote = $("#plan");
    hote.innerHTML = "";
    planSalles = {};
    planPoints = {};

    planSvg = svgel("svg", { viewBox: "0 0 564 348", role: "img" });
    planSvg.setAttribute("aria-label",
        "Plan du vaisseau : neuf salles et l'equipage figure par des points.");

    /* coque et coursive */
    planSvg.appendChild(svgel("rect", {
        x: 20, y: 20, width: 524, height: 320, rx: 18,
        fill: "none", stroke: "var(--ink)", "stroke-width": 1.6
    }));
    planSvg.appendChild(svgel("rect", {
        x: 40, y: 152, width: 484, height: 26,
        fill: "none", stroke: "var(--line)", "stroke-width": 1
    }));

    var i, s;
    for (i = 0; i < V.salles.length; i++) {
        s = V.salles[i];
        planSvg.appendChild(construireSalle(s));
    }

    couchePoints = svgel("g", {});
    planSvg.appendChild(couchePoints);

    hote.appendChild(planSvg);

    planSvg.addEventListener("mousemove", deplacerPorte);
    planSvg.addEventListener("mouseup", lacher);
    planSvg.addEventListener("mouseleave", function () {
        if (porte) { porte = null; planSvg.classList.remove("porte"); majPoints(); majPlan(); }
    });

    majPoints();
}

function construireSalle(s) {
    var g = svgel("g", { class: "salle", "data-id": s.id });
    g.style.cursor = s.verrouille ? "default" : "pointer";

    var cadre = svgel("rect", {
        x: s.x, y: s.y, width: s.w, height: s.h,
        fill: "var(--panel)", stroke: "var(--dim)", "stroke-width": 1.2
    });
    g.appendChild(cadre);

    var nom = svgel("text", {
        x: s.x + 8, y: s.y + 16, fill: "var(--dim)",
        "font-size": 11, "letter-spacing": ".08em"
    });
    nom.textContent = s.nom.toUpperCase();
    g.appendChild(nom);

    var noeuds = { g: g, cadre: cadre, nom: nom };

    if (!s.verrouille) {
        /* l'etat, en un mot, sous le nom */
        var etatT = svgel("text", {
            x: s.x + 8, y: s.y + s.h - 18, fill: "var(--dim)", "font-size": 10
        });
        g.appendChild(etatT);
        noeuds.etat = etatT;

        /* la barre d'integrite, collee en bas de la salle */
        g.appendChild(svgel("rect", {
            x: s.x + 8, y: s.y + s.h - 12, width: s.w - 16, height: 4,
            fill: "none", stroke: "var(--line)", "stroke-width": 1
        }));
        var jauge = svgel("rect", {
            x: s.x + 9, y: s.y + s.h - 11, width: s.w - 18, height: 2, fill: "var(--ink)"
        });
        g.appendChild(jauge);
        noeuds.jauge = jauge;

        /* ce que la salle fait en ce moment : un debit, ou l'avancement
           de son chantier. C'est la ligne qu'on lit sans ouvrir la fiche. */
        var travT = svgel("text", {
            x: s.x + 8, y: s.y + 30, fill: "var(--ink)", "font-size": 10
        });
        g.appendChild(travT);
        noeuds.trav = travT;

        var saleT = svgel("text", {
            x: s.x + s.w - 8, y: s.y + s.h - 18, fill: "var(--attn)",
            "font-size": 10, "text-anchor": "end", opacity: 0
        });
        g.appendChild(saleT);
        noeuds.sale = saleT;

        if (s.postes > 0) {
            var pT = svgel("text", {
                x: s.x + s.w - 8, y: s.y + 16, fill: "var(--dim)",
                "font-size": 11, "text-anchor": "end"
            });
            g.appendChild(pT);
            noeuds.postes = pT;
        }

        g.addEventListener("click", function () {
            V.selection = { type: "salle", id: s.id };
            rafraichir();
        });
    }

    planSalles[s.id] = noeuds;
    return g;
}

/* ---- QUELLE SALLE SOUS CE POINT DU PLAN ---- */
function salleSous(px, py) {
    var i, s;
    for (i = 0; i < V.salles.length; i++) {
        s = V.salles[i];
        if (px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) return s;
    }
    return null;
}

/* Les coordonnees du plan pour un evenement souris. */
function planXY(ev) {
    var r = planSvg.getBoundingClientRect();
    return {
        x: (ev.clientX - r.left) / r.width * 564,
        y: (ev.clientY - r.top) / r.height * 348
    };
}

/* ================= SOULEVER QUELQU'UN =================
   On attrape un point, on le promene, on le lache dans une salle : un menu
   demande alors ce qu'il doit y faire. Tant qu'on tient le point, la salle
   survolee s'allume - et celles qui n'accepteraient rien restent eteintes. */
var porte = null;   /* { id, x, y, survol } */

function prendre(id, ev) {
    if (etat !== "jeu") return;
    var c = cloneParId(id);
    if (!c || !c.vivant) return;
    var p = planXY(ev);
    porte = { id: id, x: p.x, y: p.y, survol: null, depart: { x: c.x, y: c.y } };
    V.selection = { type: "clone", id: id };
    planSvg.classList.add("porte");
    rafraichir();
}

function deplacerPorte(ev) {
    if (!porte) return;
    var p = planXY(ev);
    porte.x = p.x; porte.y = p.y;
    var s = salleSous(p.x, p.y);
    porte.survol = (s && !s.verrouille) ? s.id : null;
    majPoints();
    majPlan();
}

function lacher(ev) {
    if (!porte) return;
    var p = planXY(ev);
    var s = salleSous(p.x, p.y);
    var id = porte.id;
    porte = null;
    planSvg.classList.remove("porte");
    if (s && !s.verrouille) ouvrirMenuOrdre(id, s, ev.clientX, ev.clientY);
    else { majPoints(); majPlan(); }
}

/* ---- LE PETIT MENU D'ORDRES ---- */
function ouvrirMenuOrdre(cloneId, s, ecx, ecy) {
    fermerMenu();
    var c = cloneParId(cloneId);
    if (!c) return;

    var m = bal("div", "ordmenu");
    var h = '<div class="ordhd">' + c.prenom + " " + c.nom
          + '<span>' + s.nom + "</span></div>";
    var liste = ordresPour(s), i, o;
    for (i = 0; i < liste.length; i++) {
        o = liste[i];
        h += '<div class="ord' + (o.raison ? " no" : "") + '"'
           + (o.raison ? "" : ' data-k="' + o.k + '"') + ">"
           + '<span class="on">' + o.n + "</span>"
           + '<span class="od">' + (o.raison ? o.raison : o.d) + "</span></div>";
    }
    h += '<div class="ord" data-k="annule"><span class="on">Laisser tranquille</span>'
       + '<span class="od">Il reprend ses coursives.</span></div>';
    m.innerHTML = h;
    document.body.appendChild(m);

    /* le menu suit la souris mais ne sort jamais de la fenetre */
    var r = m.getBoundingClientRect();
    var x = Math.min(ecx + 8, window.innerWidth - r.width - 10);
    var y = Math.min(ecy + 8, window.innerHeight - r.height - 10);
    m.style.left = Math.max(8, x) + "px";
    m.style.top = Math.max(8, y) + "px";

    $$(".ordmenu .ord[data-k]").forEach(function (el) {
        el.addEventListener("click", function () {
            var k = el.dataset.k;
            if (k === "annule") affecter(cloneId, "libre", null);
            else affecter(cloneId, k, s.id);
            fermerMenu();
        });
    });
    menuOuvert = m;
}

var menuOuvert = null;
function fermerMenu() {
    if (menuOuvert && menuOuvert.parentNode) menuOuvert.parentNode.removeChild(menuOuvert);
    menuOuvert = null;
}

/* ---- RAFRAICHIR L'ETAT DES SALLES ---- */
function majPlan() {
    var i, s, n, sel = V.selection;
    for (i = 0; i < V.salles.length; i++) {
        s = V.salles[i];
        n = planSalles[s.id];
        if (!n) continue;

        var choisie = (sel && sel.type === "salle" && sel.id === s.id);
        var vise = (porte && porte.survol === s.id);

        if (s.verrouille) {
            n.cadre.setAttribute("stroke", "var(--line)");
            n.cadre.setAttribute("stroke-dasharray", "4 4");
            continue;
        }

        var couleur = "var(--dim)", tirets = "", mot = "";

        if (s.integrite < CFG.PANNE) { couleur = "var(--mal)"; tirets = "5 4"; mot = "PANNE"; }
        else if (s.coupee) { couleur = "var(--attn)"; tirets = "5 4"; mot = "COUPEE"; }
        else if (s.active) {
            couleur = "var(--ink)";
            mot = s.postes > 0 ? (s.part < 0.99 ? "REGIME " + Math.round(s.part * 100) + "%"
                                                : "EN MARCHE") : "";
        }
        else if (s.postes > 0) { couleur = "var(--dim)"; mot = "SANS PERSONNEL"; }

        n.cadre.setAttribute("stroke", (choisie || vise) ? "var(--ink)" : couleur);
        n.cadre.setAttribute("stroke-width", vise ? 3 : (choisie ? 2.2 : 1.2));
        n.cadre.setAttribute("fill", vise ? "var(--panel2)" : "var(--panel)");
        if (tirets) n.cadre.setAttribute("stroke-dasharray", tirets);
        else n.cadre.removeAttribute("stroke-dasharray");
        n.nom.setAttribute("fill", s.active ? "var(--ink)" : "var(--dim)");

        if (n.etat) {
            n.etat.textContent = mot;
            n.etat.setAttribute("fill", couleur === "var(--ink)" ? "var(--dim)" : couleur);
        }
        if (n.trav) n.trav.textContent = travailCourt(s);
        if (n.sale) {
            n.sale.setAttribute("opacity", s.salete > 22 ? 1 : 0);
            n.sale.textContent = (s.salete > 70 ? "CRASSE " : "SALE ") + Math.round(s.salete);
        }
        if (n.jauge) {
            var large = (s.w - 18) * (s.integrite / 100);
            n.jauge.setAttribute("width", large < 0 ? 0 : large);
            n.jauge.setAttribute("fill",
                s.integrite < CFG.PANNE ? "var(--mal)" :
                s.integrite < 40 ? "var(--attn)" : "var(--ink)");
        }
        if (n.postes) {
            var tenus = affectesA(s.id).length;
            var titres = titulairesDe(s.id).length;
            /* un dormeur garde son poste : on ecrit 1(2)/2 pour le dire */
            n.postes.textContent = tenus + (titres > tenus ? "(" + titres + ")" : "")
                                 + "/" + s.postes;
            n.postes.setAttribute("fill", tenus ? "var(--ink)" : "var(--dim)");
        }
    }
}

/* ---- LES POINTS ---- */
function majPoints() {
    var i, c, p, sel = V.selection;

    /* creer les cercles manquants (une naissance en ajoute) */
    for (i = 0; i < V.clones.length; i++) {
        c = V.clones[i];
        if (planPoints[c.id]) continue;
        p = svgel("circle", { r: 4.6, cx: c.x, cy: c.y, class: "pt" });
        p.style.cursor = "pointer";
        (function (id) {
            p.addEventListener("mousedown", function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                prendre(id, ev);
            });
        })(c.id);
        couchePoints.appendChild(p);
        planPoints[c.id] = p;
    }

    for (i = 0; i < V.clones.length; i++) {
        c = V.clones[i];
        p = planPoints[c.id];
        if (!p) continue;

        if (!c.vivant) { p.setAttribute("opacity", 0); continue; }

        var tenu = (porte && porte.id === c.id);
        p.setAttribute("cx", (tenu ? porte.x : c.x).toFixed(1));
        p.setAttribute("cy", (tenu ? porte.y : c.y).toFixed(1));
        p.setAttribute("opacity", 1);

        var choisi = (sel && sel.type === "clone" && sel.id === c.id);
        var e = etatClone(c);
        var teinte = e.k === "grave" ? "var(--mal)" : (e.k === "faible" ? "var(--attn)" : "var(--vie)");

        /* plein quand il travaille, cercle vide quand il ne produit rien */
        var oisif = (c.poste.type === "libre" || c.poste.type === "repos");
        p.setAttribute("fill", oisif ? "var(--bg)" : teinte);
        p.setAttribute("stroke", teinte);
        p.setAttribute("stroke-width", oisif ? 1.6 : 0);
        /* LE GESTE. Quand il est a son poste et qu'il s'affaire, le point
           respire ; quand il dort, il s'eteint a moitie. On voit travailler
           l'equipage sans lire une seule ligne. */
        var base = tenu ? 7.6 : (choisi ? 6.4 : 4.6);
        if (sAffaire(c)) base += 1.5 * Math.abs(Math.sin(HORLOGE * 3.2 + c.phase));
        p.setAttribute("r", base.toFixed(2));
        p.setAttribute("opacity", c.auto === "repos" ? 0.45 : 1);
    }
}
