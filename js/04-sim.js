"use strict";
/* ================================================================
   MEMOIRE VIVE - 04-sim.js
   La simulation. Un pas = 1/60 de seconde de jeu, multiplie par la
   vitesse choisie. Tout y est exprime PAR JOUR puis ramene au pas :
   on peut donc lire les chiffres de 00-config.js comme des phrases
   ("la ferme rend 5 vivres par jour") sans rien convertir de tete.

   L'ordre compte, et il est toujours le meme :
   energie -> coupures -> production -> usure -> les corps -> les morts.
   ================================================================ */

var CORR_Y = 165;   /* la coursive centrale du plan */

/* ---- OU SE TIENT UN CLONE ---- */
function salleDuPoste(c) {
    var p = c.poste;
    if (p.type === "repos") return salleParId("vie");
    if (p.type === "libre") return null;
    return salleParId(p.id);
}

function placerAuPoste(c, immediat) {
    var s = salleDuPoste(c), tx, ty;
    if (s) {
        tx = s.x + 22 + rnd() * (s.w - 44);
        ty = s.y + 24 + rnd() * (s.h - 48);
    } else {
        /* libre : quelque part dans la coursive */
        tx = 60 + rnd() * 440;
        ty = CORR_Y - 2 + rnd() * 8;
    }
    c.cx = tx; c.cy = ty;
    if (immediat) { c.x = tx; c.y = ty; c.chemin = []; return; }
    /* on passe par la coursive : jamais a travers une cloison */
    c.chemin = [{ x: c.x, y: CORR_Y }, { x: tx, y: CORR_Y }, { x: tx, y: ty }];
}

function marcher(c, dt) {
    if (!c.vivant) return;
    if (!c.chemin.length) {
        c.pause -= dt;
        if (c.pause <= 0) { placerAuPoste(c, false); c.pause = 2 + rnd() * 6; }
        return;
    }
    var t = c.chemin[0], dx = t.x - c.x, dy = t.y - c.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1.5) { c.x = t.x; c.y = t.y; c.chemin.shift(); return; }
    var vit = 42 * dt;   /* unites de plan par seconde */
    if (vit > d) vit = d;
    c.x += dx / d * vit;
    c.y += dy / d * vit;
}

/* ---- LE GRAND LIVRE DU PAS ----
   Chaque mouvement de reserve est note avec sa provenance. L'ecran vide ce
   livre a chaque image : c'est lui qui lance les traits lumineux depuis la
   salle vers la jauge, et qui fait apparaitre les chiffres. */
function noteFlux(src, k, v) {
    if (!src) src = "bord";
    if (!V.flux[src]) V.flux[src] = {};
    V.flux[src][k] = (V.flux[src][k] || 0) + v;
}

/* ---- AJOUTER / RETIRER UNE RESERVE, SANS JAMAIS DEPASSER LA CUVE ----
   Ce qui deborde d'une reserve pleine est PERDU, et on le dit : remplir
   une cuve deja pleine, c'est jeter ce qu'on vient de produire. */
function ajoute(k, v, src) {
    if (!isFinite(v)) return;
    if (v === 0) return;
    var avant = V.res[k];
    var apres = avant + v;
    if (apres > CFG.CAP[k]) {
        V.perte[k] = (V.perte[k] || 0) + (apres - CFG.CAP[k]);
        apres = CFG.CAP[k];
    }
    if (apres < 0) apres = 0;
    V.res[k] = apres;
    noteFlux(src, k, apres - avant);
}

/* Retire ce qu'on peut et dit quelle FRACTION on a reellement eue.
   C'est ce qui permet a une ferme de tourner au ralenti quand l'eau
   manque, au lieu de s'arreter net ou de produire a credit. */
function retire(k, v, src) {
    /* GARDE-FOU. Une constante oubliee dans 00-config.js rendait v indefini,
       donc NaN, et le NaN contaminait silencieusement la reserve ET
       l'integrite de la salle. Mieux vaut ne rien faire et le dire. */
    if (!isFinite(v)) {
        if (!V.alertes["nan_" + k]) {
            V.alertes["nan_" + k] = true;
            logMsg("Anomalie de calcul sur " + k + " (" + (src || "bord") + ").", "mal");
        }
        return 0;
    }
    if (v <= 0) return 1;
    var dispo = V.res[k];
    if (dispo >= v) { V.res[k] = dispo - v; noteFlux(src, k, -v); return 1; }
    V.res[k] = 0;
    if (dispo > 0) noteFlux(src, k, -dispo);
    return dispo / v;
}

/* ================= UN PAS DE SIMULATION ================= */
function simPas(dtSec) {
    if (etat !== "jeu" || !V) return;

    var dj = dtSec / CFG.SEC_PAR_JOUR;     /* la fraction de jour ecoulee */
    var i, s, c, n;
    var equipage = vivants();
    var nv = equipage.length;

    V.tick++;
    var jourAvant = Math.floor(V.jour);
    V.jour += dj;

    /* ---------------------------------------------------------------
       1. QUI VEUT TOURNER, ET AVEC QUEL RENDEMENT
       --------------------------------------------------------------- */
    for (i = 0; i < V.salles.length; i++) {
        s = V.salles[i];
        s.coupee = false;
        s.active = false;
        s.rendement = 0;

        if (s.verrouille) continue;
        if (s.integrite < CFG.PANNE) continue;

        if (s.postes === 0) {
            s.veut = true;
            s.rendement = 1;
        } else {
            var eq = affectesA(s.id);
            if (!eq.length) { s.veut = false; continue; }
            var r = 0;
            for (n = 0; n < eq.length; n++) r += rendementClone(eq[n], s.comp);
            /* UNE SALLE SALE REND MOINS, mais pas tout de suite : les
               premiers points de crasse sont gratuits. Sans ce seuil, il
               faudrait un homme a la serpilliere des le premier jour, et il
               n'y en a pas de libre. */
            if (s.salete > CFG.SALETE_SEUIL) {
                r *= (1 - ((s.salete - CFG.SALETE_SEUIL) / (100 - CFG.SALETE_SEUIL))
                          * CFG.SALETE_MALUS);
            }
            s.rendement = clamp(r, 0, s.postes);
            s.veut = s.rendement > 0.02;
        }
    }

    /* ---------------------------------------------------------------
       2. L'ENERGIE, ET LES COUPURES
       Les machines produisent ; tout le reste consomme. Quand la
       demande depasse l'offre, les salles tombent dans l'ordre de
       priorite - la naissance d'abord, la ferme en dernier.
       --------------------------------------------------------------- */
    var machines = salleParId("machines");
    var produite = (machines.veut ? machines.rendement * RECETTES.machines.rend.energie : 0);

    var candidates = V.salles.filter(function (x) { return x.veut && x.en > 0; });
    var demandee = 0;
    for (i = 0; i < candidates.length; i++) demandee += candidates[i].en;

    if (demandee > produite) {
        candidates.sort(function (a, b) { return a.prio - b.prio; });
        for (i = 0; i < candidates.length && demandee > produite; i++) {
            candidates[i].coupee = true;
            demandee -= candidates[i].en;
        }
    }

    V.energie.produite = produite;
    V.energie.demandee = demandee;

    for (i = 0; i < V.salles.length; i++) {
        s = V.salles[i];
        s.active = !!s.veut && !s.coupee;
        if (!s.active) s.rendement = 0;
    }

    if (produite <= 0.01 && nv > 0) {
        alerte("nrj", "Plus une seule machine ne tourne. Le bord est dans le noir.", "mal");
    } else if (demandee >= produite - 0.01 && V.salles.some(function (x) { return x.coupee; })) {
        alerte("nrj2", "L'energie ne suffit plus : des salles sont coupees.", "mal");
    } else {
        alerteLevee("nrj"); alerteLevee("nrj2");
    }

    /* ---------------------------------------------------------------
       3. CE QUE LES SALLES FONT
       --------------------------------------------------------------- */
    var ferme = salleParId("ferme");
    if (ferme.active) {
        var fr = retire("eau", RECETTES.ferme.cout.eau * ferme.rendement * dj, "ferme");
        ajoute("vivres", RECETTES.ferme.rend.vivres * ferme.rendement * fr * dj, "ferme");
        ajoute("oxy", RECETTES.ferme.rend.oxy * ferme.rendement * fr * dj, "ferme");
    }

    var recy = salleParId("recyclage");
    if (recy.active) {
        /* l'eau d'abord : la boucle grise tourne meme quand il n'y a pas
           un gramme de dechet solide a broyer */
        ajoute("eau", RECETTES.recyclage.rend.eau * recy.rendement * dj, "recyclage");
        var rr = retire("dechets", RECETTES.recyclage.cout.dechets * recy.rendement * dj, "recyclage");
        ajoute("mat", RECETTES.recyclage.rend.mat * recy.rendement * rr * dj, "recyclage");
    }

    /* le moteur ne pousse que si quelqu'un tient le cap */
    var moteur = salleParId("moteur");
    var controle = salleParId("controle");
    if (moteur.active && controle.active) {
        V.distance = clamp(V.distance + CFG.AVANCE_JOUR * moteur.rendement * dj, 0, CFG.RELAIS);
        alerteLevee("cap");
    } else if (moteur.active && !controle.active) {
        alerte("cap", "Le moteur pousse, mais personne ne tient le controle : le vaisseau derive.", "mal");
    }

    /* ---------------------------------------------------------------
       4. LA SALETE, L'USURE, ET CEUX QU'ON Y A MIS
       Reparer et nettoyer ne sont plus des postes flottants : on envoie
       quelqu'un DANS une salle, et il s'occupe de CETTE salle-la.
       --------------------------------------------------------------- */
    var menage = controle.active ? 0.74 : 1;   /* un cap tenu menage le materiel */
    var nett, repa, force, gain, cout, frac, ote;

    for (i = 0; i < V.salles.length; i++) {
        s = V.salles[i];
        if (s.verrouille) continue;

        /* elle se salit */
        s.salete = clamp(s.salete + (s.active ? CFG.SALETE_JOUR : CFG.SALETE_ARRET) * dj, 0, 100);

        /* on la nettoie : ce qu'on ramasse part a la cuve a dechets, ou le
           recyclage en tirera de la matiere. Rien ne se perd. */
        nett = aLaSalle(s.id, "nettoyage");
        if (nett.length && s.salete > 0) {
            force = 0;
            for (n = 0; n < nett.length; n++) force += rendementClone(nett[n], "chimie");
            ote = Math.min(s.salete, force * CFG.NETTOIE_JOUR * dj);
            s.salete -= ote;
            ajoute("dechets", ote * CFG.SALETE_VERS_DECHETS, s.id);
        }

        /* ELLE S'USE, MAIS MOINS SI QUELQU'UN Y TRAVAILLE. Un operateur
           graisse, resserre et ecoute sa machine sans qu'on le lui demande :
           c'est la salle abandonnee qui se degrade vraiment. Sans cette
           regle, il faudrait un reparateur a plein temps des le premier
           jour - et avec quatre corps, il n'y en a pas. */
        var taux = (s.active && !s.passive) ? CFG.USURE_JOUR : CFG.USURE_ARRET;
        /* une salle sans poste (la salle de vie, le stockage) n'a pas de
           machinerie a user : ceux qui y vivent l'entretiennent d'eux-memes */
        if (s.postes === 0 || affectesA(s.id).length) taux *= CFG.USURE_TENUE;
        s.integrite -= taux * menage * dj;
        if (s.integrite < 0) s.integrite = 0;

        /* on la repare, et ca coute de la matiere */
        repa = aLaSalle(s.id, "reparation");
        if (repa.length && s.integrite < 100) {
            force = 0;
            for (n = 0; n < repa.length; n++) force += rendementClone(repa[n], "mecanique");
            if (controle.active) force *= 1.15;
            gain = Math.min(force * CFG.REPARE_JOUR * dj, 100 - s.integrite);
            cout = gain * CFG.REPARE_MAT;
            frac = retire("mat", cout, s.id);
            s.integrite = clamp(s.integrite + gain * frac, 0, 100);
            if (frac < 0.999) {
                alerte("nomat", "Il n'y a plus de materiaux : les reparations s'arretent.", "mal");
            } else { alerteLevee("nomat"); }
        }

        if (s.integrite < CFG.PANNE) {
            alerte("panne_" + s.id, s.nom + " est hors service : envoyez quelqu'un la reparer.", "mal");
        } else {
            alerteLevee("panne_" + s.id);
        }
    }

    /* ---------------------------------------------------------------
       5. LES CORPS
       --------------------------------------------------------------- */
    var vie = salleParId("vie");
    if (!vie.active && nv > 0) {
        alerte("vie", "La salle de vie est " + (vie.coupee ? "coupee" : "hors service")
             + " : personne ne peut ni manger ni dormir.", "mal");
    } else { alerteLevee("vie"); }
    if (V.res.vivres < 1 && nv > 0) alerte("vivres", "Il ne reste plus rien a manger.", "mal");
    else alerteLevee("vivres");

    var insalubre = (V.res.dechets / CFG.CAP.dechets) > CFG.DECHETS_SEUIL;
    if (insalubre) alerte("sale", "Les dechets debordent. L'air devient malsain.", "mal");
    else alerteLevee("sale");

    /* ce que l'equipage respire et boit */
    var fOxy = retire("oxy", CFG.OXY_PAR_CLONE * nv * dj, "bord");
    var fEau = retire("eau", CFG.EAU_PAR_CLONE * nv * dj, "bord");
    if (fOxy < 0.999) alerte("oxy", "L'oxygene est epuise. On etouffe dans les coursives.", "mal");
    else alerteLevee("oxy");
    if (fEau < 0.999) alerte("eau", "Plus d'eau potable a bord.", "mal");
    else alerteLevee("eau");

    var deuil = 0;

    for (i = 0; i < V.clones.length; i++) {
        c = V.clones[i];
        if (!c.vivant) continue;

        /* faim */
        c.faim = clamp(c.faim + CFG.FAIM_JOUR * dj, 0, 100);
        if (c.faim > CFG.FAIM_SEUIL_REPAS && vie.active && V.res.vivres >= CFG.VIVRES_REPAS) {
            retire("vivres", CFG.VIVRES_REPAS, "vie");
            c.faim = clamp(c.faim - CFG.FAIM_REPAS, 0, 100);
            ajoute("dechets", 0.4, "vie");
        }

        /* fatigue */
        var df;
        if (c.poste.type === "repos") df = vie.active ? CFG.FATIGUE_REPOS : -8;
        else if (c.poste.type === "libre" || c.poste.type === "defense") df = CFG.FATIGUE_LIBRE;
        else df = CFG.FATIGUE_TRAVAIL;
        c.fatigue = clamp(c.fatigue + df * dj, 0, 100);

        /* sante */
        var ds = 0;
        if (c.faim > CFG.FAIM_CRITIQUE) ds += CFG.SANTE_FAIM;
        if (fOxy < 0.999) ds += CFG.SANTE_ASPHYXIE;
        if (fEau < 0.999) ds += -8;
        if (insalubre) ds += CFG.SANTE_INSALUBRE;
        if (c.fatigue >= CFG.FATIGUE_EPUISE) ds += CFG.SANTE_EPUISEMENT;
        if (ds === 0 && c.faim < 60 && c.fatigue < 80) ds = CFG.SANTE_REGEN;
        c.sante = clamp(c.sante + ds * dj, 0, 100);

        /* moral */
        var dm;
        if (c.faim > 75 || c.fatigue > 85 || c.sante < 50) dm = CFG.MORAL_MALHEUR;
        else if (c.poste.type === "repos" && vie.active) dm = CFG.MORAL_REPOS;
        else dm = (c.moral < 62 ? 1.2 : -0.4);
        c.moral = clamp(c.moral + dm * dj, 0, 100);

        /* vieillir : purement narratif pour l'instant */
        c.age += dj / 365;

        if (c.fatigue >= CFG.FATIGUE_EPUISE) {
            alerte("epuise_" + c.id, c.nomComplet + " s'effondre de fatigue. Mettez-le au repos.", "mal");
        } else if (c.fatigue < 55) { alerteLevee("epuise_" + c.id); }

        /* mourir */
        if (c.sante <= 0) {
            c.vivant = false;
            c.cause = (fOxy < 0.999) ? "asphyxie"
                    : (fEau < 0.999) ? "soif"
                    : (c.faim > CFG.FAIM_CRITIQUE) ? "faim"
                    : (insalubre) ? "maladie" : "epuisement";
            c.poste = { type: "libre", id: null };
            ajoute("dechets", 9, "vie");
            deuil++;
            logMsg(c.nomComplet + " est mort (" + c.cause + "). Le corps part au recyclage.", "mal");
        }

        marcher(c, dtSec);
    }

    if (deuil) {
        var reste = vivants();
        for (i = 0; i < reste.length; i++) {
            reste[i].moral = clamp(reste[i].moral + CFG.MORAL_DEUIL * deuil, 0, 100);
        }
    }

    /* les dechets du jour */
    var nSalles = V.salles.filter(function (x) { return x.active; }).length;
    ajoute("dechets", (CFG.DECHET_PAR_CLONE * nv + CFG.DECHET_PAR_SALLE * nSalles) * dj, "bord");

    /* ---------------------------------------------------------------
       6. LA CUVE
       --------------------------------------------------------------- */
    var naiss = salleParId("naissance");
    if (V.decantation) {
        if (naiss.active && naiss.rendement > 0.15) {
            V.decantation.reste -= dj * clamp(naiss.rendement, 0, 1.4);
            alerteLevee("cuve");
        } else {
            alerte("cuve", "La cuve de decantation est a l'arret : il y faut quelqu'un, et du courant.", "mal");
        }
        if (V.decantation.reste <= 0) {
            var neuf = faireClone();
            V.clones.push(neuf);
            placerAuPoste(neuf, true);
            V.decantation = null;
            logMsg(neuf.nomComplet + " ouvre les yeux. Se souvient de " + neuf.souvenir + ".", "bien");
        }
    }

    /* ---------------------------------------------------------------
       7. LE JOUR QUI PASSE, ET LA FIN
       --------------------------------------------------------------- */
    if (Math.floor(V.jour) !== jourAvant) {
        if (Math.floor(V.jour) % 10 === 0) {
            logMsg("Jour " + Math.floor(V.jour) + ". Progression " + pc(V.distance) + ".", "");
        }
    }

    if (V.distance >= CFG.RELAIS) { finPartie("relais"); return; }
    if (nv > 0 && vivants().length === 0) { finPartie("extinction"); return; }
}

/* ================= LANCER UNE DECANTATION ================= */
function lancerDecantation() {
    if (V.decantation) return "Une cuve tourne deja.";
    if (V.res.mat < CFG.NAISSANCE_MAT) {
        return "Il manque " + Math.ceil(CFG.NAISSANCE_MAT - V.res.mat) + " materiaux.";
    }
    V.res.mat -= CFG.NAISSANCE_MAT;
    V.decantation = { reste: CFG.NAISSANCE_JOURS };
    logMsg("Cuve amorcee. Un corps dans " + CFG.NAISSANCE_JOURS + " jours, si on l'alimente.", "bien");
    return null;
}

/* ================= DONNER UN ORDRE =================
   Un ordre vise une salle, sauf "repos" et "libre". On refuse un poste de
   travail deja plein : c'est la seule regle qui bloque. */
function affecter(cloneId, type, salleId) {
    var c = cloneParId(cloneId);
    if (!c || !c.vivant) return false;

    if (type === "libre" || type === "repos") {
        c.poste = { type: type, id: null };
    } else {
        var s = salleParId(salleId);
        if (!s || s.verrouille) return false;
        if (type === "travail") {
            if (s.postes === 0) return false;
            var deja = (c.poste.type === "travail" && c.poste.id === salleId);
            if (!deja && affectesA(salleId).length >= s.postes) return false;
        }
        c.poste = { type: type, id: salleId };
    }
    placerAuPoste(c, false);
    if (typeof rafraichir === "function") rafraichir();
    return true;
}
