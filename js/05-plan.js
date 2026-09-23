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

/* ---- RAFRAICHIR L'ETAT DES SALLES ---- */
function majPlan() {
    var i, s, n, sel = V.selection;
    for (i = 0; i < V.salles.length; i++) {
        s = V.salles[i];
        n = planSalles[s.id];
        if (!n) continue;

        var choisie = (sel && sel.type === "salle" && sel.id === s.id);

        if (s.verrouille) {
            n.cadre.setAttribute("stroke", "var(--line)");
            n.cadre.setAttribute("stroke-dasharray", "4 4");
            continue;
        }

        var couleur = "var(--dim)", tirets = "", mot = "";

        if (s.integrite < CFG.PANNE) { couleur = "var(--mal)"; tirets = "5 4"; mot = "PANNE"; }
        else if (s.coupee) { couleur = "var(--attn)"; tirets = "5 4"; mot = "COUPEE"; }
        else if (s.active) { couleur = "var(--ink)"; mot = s.postes > 0 ? "EN MARCHE" : ""; }
        else if (s.postes > 0) { couleur = "var(--dim)"; mot = "SANS PERSONNEL"; }

        n.cadre.setAttribute("stroke", choisie ? "var(--ink)" : couleur);
        n.cadre.setAttribute("stroke-width", choisie ? 2.2 : 1.2);
        if (tirets) n.cadre.setAttribute("stroke-dasharray", tirets);
        else n.cadre.removeAttribute("stroke-dasharray");
        n.nom.setAttribute("fill", s.active ? "var(--ink)" : "var(--dim)");

        if (n.etat) {
            n.etat.textContent = mot;
            n.etat.setAttribute("fill", couleur === "var(--ink)" ? "var(--dim)" : couleur);
        }
        if (n.jauge) {
            var large = (s.w - 18) * (s.integrite / 100);
            n.jauge.setAttribute("width", large < 0 ? 0 : large);
            n.jauge.setAttribute("fill",
                s.integrite < CFG.PANNE ? "var(--mal)" :
                s.integrite < 40 ? "var(--attn)" : "var(--ink)");
        }
        if (n.postes) {
            n.postes.textContent = affectesA(s.id).length + "/" + s.postes;
            n.postes.setAttribute("fill",
                affectesA(s.id).length ? "var(--ink)" : "var(--dim)");
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
            p.addEventListener("click", function (ev) {
                ev.stopPropagation();
                V.selection = { type: "clone", id: id };
                rafraichir();
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

        p.setAttribute("cx", c.x.toFixed(1));
        p.setAttribute("cy", c.y.toFixed(1));
        p.setAttribute("opacity", 1);

        var choisi = (sel && sel.type === "clone" && sel.id === c.id);
        var e = etatClone(c);
        var teinte = e.k === "grave" ? "var(--mal)" : (e.k === "faible" ? "var(--attn)" : "var(--vie)");

        /* plein quand il travaille, cercle vide quand il ne produit rien */
        var oisif = (c.poste.type === "libre" || c.poste.type === "repos");
        p.setAttribute("fill", oisif ? "var(--bg)" : teinte);
        p.setAttribute("stroke", teinte);
        p.setAttribute("stroke-width", oisif ? 1.6 : 0);
        p.setAttribute("r", choisi ? 6.4 : 4.6);
    }
}
