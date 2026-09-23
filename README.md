# Mémoire Vive

La Terre est morte. Chaque nation a lancé une arche. À bord, pas un seul humain
né : rien que des clones décantés adultes, chacun portant le corps, le métier et
un souvenir d'un mort de la Terre. **Vous êtes une conscience humaine enfermée
dans l'ordinateur du vaisseau.** Vous ne touchez rien — vous affectez des postes.

**Pour jouer : ouvrir `index.html`.** Double-clic, aucun serveur.

## Ce que fait cette première tranche

Un seul écran, le plan du vaisseau, et une seule chose à y faire : **répartir
les gens**. Pas d'extraterrestres, pas de carte des étoiles, pas de
construction, pas de sorties. Le but est de savoir tout de suite si le noyau est
tendu ou plat.

- **Neuf salles** qui réclament des postes, du courant et des réserves.
- **Les machines produisent toute l'énergie**, tout le reste en consomme. Quand
  l'offre ne suffit plus, les salles tombent par ordre de priorité — le moteur
  d'abord, la ferme en dernier. La salle de vie ne se coupe jamais.
- **Les salles s'usent.** Sous 12 % d'intégrité, elles ne redémarrent plus. Un
  clone à l'entretien répare la plus abîmée — donc un clone de moins ailleurs.
- **Le cycle se boucle** : la ferme boit de l'eau et rend vivres et oxygène ; le
  recyclage rend l'eau grise et tire des matériaux des déchets. Les corps font
  des déchets rien qu'en vivant, et les morts aussi.
- **Les clones ne sont pas des unités.** Le souvenir donne les compétences : le
  soudeur est bon en mécanique, la maraîchère en botanique. Fatigue, faim, santé
  et moral multiplient ce qu'ils valent à leur poste.
- **La cuve** : 80 matériaux, 10 jours, un poste tenu. La seule façon d'être plus
  nombreux — et les matériaux ne viennent que du recyclage.
- **Deux fins** : le premier relais atteint, ou l'extinction.

Commandes : **Espace** pause, **1 2 3** vitesses. Clic sur une salle ou sur un
point pour ouvrir sa fiche ; les postes s'attribuent depuis la fiche du clone.

## Les fichiers

| Fichier | Lignes | Ce qu'il contient |
|---|---:|---|
| `index.html` | 179 | la page, les balises, et le suivi de projet en tête |
| `css/mv.css` | 247 | la feuille de style — l'ambiance ambre tient en six variables |
| `js/00-config.js` | 176 | **tous les chiffres du jeu**, une valeur par ligne |
| `js/01-utils.js` | 65 | le hasard reproductible, les bornes, les raccourcis DOM |
| `js/02-clones.js` | 151 | les vies d'avant, les souvenirs, fabriquer quelqu'un |
| `js/03-etat.js` | 131 | `V`, l'état de la partie, et la nouvelle partie |
| `js/04-sim.js` | 365 | la simulation : énergie, coupures, production, usure, les corps |
| `js/05-plan.js` | 196 | le plan du vaisseau en SVG |
| `js/06-panneaux.js` | 316 | les cartes, les jauges, l'équipage, le journal |
| `js/07-boucle.js` | 160 | le menu, la boucle à pas fixe, les deux fins |

Des `<script src>` classiques, pas des modules ES : portée globale partagée, et
le jeu s'ouvre sans serveur. L'ordre des balises dans `index.html` **est**
l'ordre d'exécution.

## Régler le jeu

Tout se tourne dans `js/00-config.js`. Une valeur par ligne, commentée en
français. C'est là qu'on vient quand une partie est trop dure ou trop molle.

## Le banc

```
npm install && npx playwright install chromium
npm run banc       # joue une partie entière en accéléré, avec un pilote automatique
npm run naufrage   # la même chose sans pilote : le vaisseau meurt, et on voit de quoi
npm run check      # node --check sur chaque fichier de js/
```

Le banc ouvre la page dans un vrai Chromium, force la graine, joue jour par jour
et sort un tableau toutes les vingt journées. Il a trouvé huit naufrages avant
que le jeu tienne : la salle de vie coupée en premier (tout le monde mourait de
faim avec 150 vivres en réserve), l'épuisement simultané des quatre, le cycle de
l'eau qui ne se refermait pas, l'usure qui emportait les machines, le recyclage
jamais tenu. Le relais est maintenant atteint au jour 1651 **avec un pilote
médiocre** — un joueur attentif ira beaucoup plus vite.
