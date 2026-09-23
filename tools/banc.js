/* Banc de Memoire Vive : ouvre la page dans un vrai Chromium, joue une
   partie en accelere et rend un bilan. Sert a voir si le noyau tient et
   si les chiffres sont regles, sans avoir a jouer soi-meme.
   Usage : node tools/banc.js [jours] */
const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const jours = parseInt(process.argv[2] || "160", 10);
  /* node tools/banc.js 300 sans  -> joue sans pilote, pour voir le naufrage */
  const opts = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
  const b = await chromium.launch(opts);
  const pg = await b.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = [];
  pg.on("pageerror", e => errs.push("PAGEERROR: " + e.message));
  pg.on("console", m => { if (m.type() === "error") errs.push("CONSOLE: " + m.text()); });
  await pg.goto("file://" + path.resolve(__dirname, "..", "index.html"));
  await pg.waitForTimeout(900);

  const res = await pg.evaluate(({ jours, pilote }) => {
    demarrer(20260923);

    /* ---- LE PILOTE AUTOMATIQUE ----
       Une politique simple, celle qu'un joueur attentif tiendrait :
       on fait dormir les epuises, on garde les machines au complet,
       on met un reparateur des qu'une salle descend, et on repartit
       le reste selon les competences. Si CETTE politique ne survit
       pas, le jeu est trop dur ; si elle gagne sans effort, trop mou. */
    function jouerUnTour() {
      const eq = vivants();
      if (!eq.length) return;

      /* la salle la plus abimee : c'est la qu'on envoie reparer */
      const pireSalle = () => V.salles.filter(s => !s.verrouille)
          .sort((a, b) => a.integrite - b.integrite)[0].id;
      /* la plus sale : c'est la qu'on envoie nettoyer */
      const pireSale = () => V.salles.filter(s => !s.verrouille)
          .sort((a, b) => b.salete - a.salete)[0];

      /* LE REPOS N'EST PLUS L'AFFAIRE DU JOUEUR : les clones vont dormir et
         manger tout seuls, puis reprennent leur poste. Le pilote ne s'en
         occupe donc plus du tout - il ne touche qu'aux absents de longue
         duree, c'est-a-dire a personne. */
      const dispo = eq.filter(c => !c.auto);

      /* on vide tout, puis on remplit dans l'ordre du plus vital.
         Attention : un ordre donne annule l'absence en cours, donc on ne
         touche jamais a quelqu'un qui dort. */
      for (const c of dispo) affecter(c.id, "libre", null);

      /* L'ORDRE DES POSTES, DICTE PAR LE BESOIN DU MOMENT - c'est ce
         qu'un joueur attentif fait en regardant ses jauges. Respirer,
         puis fermer le cycle des dechets, puis etre plus nombreux, puis
         seulement avancer. */
      const cap = CFG.CAP;
      /* on arrete de faire des enfants a huit : au-dela, les bras servent
         mieux au moteur qu'a la cuve */
      const veutCuve = (V.decantation || V.res.mat >= CFG.NAISSANCE_MAT) && eq.length < 8;
      const abimee = V.salles.some(s => !s.verrouille && s.integrite < 70);
      const urgent = V.salles.some(s => !s.verrouille && s.integrite < 40);
      const sale = V.res.dechets > cap.dechets * 0.20 || V.res.mat < 220
                || V.res.eau < cap.eau * 0.6;
      const etouffe = V.res.oxy < cap.oxy * 0.45;

      const postes = [];
      postes.push({ t: "salle", id: "machines", comp: "mecanique" });
      /* une salle sous 40 d'integrite passe avant tout le reste : sans
         machines, il n'y a plus de partie */
      if (urgent) postes.push({ t: "entretien", comp: "mecanique" });
      postes.push({ t: "salle", id: "ferme", comp: "botanique" });
      /* LE MENAGE EST DEVENU LA SOURCE DES MATERIAUX : la crasse ne descend
         dans la cuve que si quelqu'un l'y porte, et c'est de la cuve que le
         recyclage tire l'eau et la matiere. On nettoie donc tot. */
      const crasse = pireSale();
      if (crasse && crasse.salete > 45) {
        postes.push({ t: "nettoyage", comp: "chimie", id: crasse.id });
      }
      if (sale) postes.push({ t: "salle", id: "recyclage", comp: "chimie" });
      if (etouffe) postes.push({ t: "salle", id: "ferme", comp: "botanique" });
      if (veutCuve) postes.push({ t: "salle", id: "naissance", comp: "medecine" });
      if (abimee) postes.push({ t: "entretien", comp: "mecanique" });

      postes.push({ t: "salle", id: "controle", comp: "commandement" });
      postes.push({ t: "salle", id: "moteur", comp: "mecanique" });
      postes.push({ t: "salle", id: "machines", comp: "mecanique" });
      postes.push({ t: "salle", id: "recyclage", comp: "chimie" });
      postes.push({ t: "salle", id: "ferme", comp: "botanique" });
      postes.push({ t: "entretien", comp: "mecanique" });

      const reste = dispo.slice();
      for (const p of postes) {
        if (!reste.length) break;
        reste.sort((x, y) => y.comp[p.comp] - x.comp[p.comp]);
        const c = reste.shift();
        if (p.t === "entretien") affecter(c.id, "reparation", p.id || pireSalle());
        else if (p.t === "nettoyage") affecter(c.id, "nettoyage", p.id);
        else affecter(c.id, "travail", p.id);
      }

          if (!V.decantation && V.res.mat >= CFG.NAISSANCE_MAT
          && affectesA("naissance").length && eq.length < 11) {
        lancerDecantation();
      }
    }

    const releves = [];
    let bug = null;
    const pasParJour = Math.round(CFG.SEC_PAR_JOUR / CFG.PAS);
    for (let j = 0; j < jours; j++) {
      if (pilote) jouerUnTour();
      for (let k = 0; k < pasParJour; k++) {
        if (etat !== "jeu") break;
        simPas(CFG.PAS);
        if (!bug) {
          for (const s of V.salles) {
            if (!isFinite(s.integrite) || !isFinite(s.salete)) {
              bug = { jour: +V.jour.toFixed(2), salle: s.id,
                      integrite: String(s.integrite), salete: String(s.salete),
                      mat: +V.res.mat.toFixed(1),
                      repa: aLaSalle(s.id, "reparation").map(c => c.id),
                      nett: aLaSalle(s.id, "nettoyage").map(c => c.id),
                      trav: affectesA(s.id).map(c => c.id) };
            }
          }
        }
      }
      if (j % 20 === 0 || etat !== "jeu") {
        releves.push({
          jour: Math.floor(V.jour),
          vivants: vivants().length,
          dist: +V.distance.toFixed(1),
          nrj: nb(V.energie.demandee) + "/" + nb(V.energie.produite),
          eau: Math.round(V.res.eau), oxy: Math.round(V.res.oxy),
          vivres: Math.round(V.res.vivres), mat: Math.round(V.res.mat),
          dechets: Math.round(V.res.dechets),
          pires: V.salles.filter(s => !s.verrouille)
                   .sort((a, b) => a.integrite - b.integrite)
                   .slice(0, 2).map(s => s.id + " " + Math.round(s.integrite)).join(", "),
          sale: Math.round(Math.max.apply(null, V.salles.map(s => s.salete)))
        });
      }
      if (etat !== "jeu") break;
    }
    return { bug, fin: V.fin, etat, releves, journal: V.journal.slice(0, 8).map(l => "J" + l.j + " " + l.txt) };
  }, { jours, pilote: process.argv[3] !== "sans" });

  if (res.bug) console.log("BUG :", JSON.stringify(res.bug));
  console.log("fin :", res.fin || "partie en cours", "(" + res.etat + ")");
  console.table(res.releves);
  console.log("\nderniers evenements :\n" + res.journal.join("\n"));
  console.log("\nerreurs :", errs.length ? errs.slice(0, 8).join("\n") : "aucune");
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
