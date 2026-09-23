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

**On prend les gens à la main** : un point bleu se soulève à la souris, se
promène sur le plan et se lâche dans une salle — un menu demande alors ce qu'il
doit y faire. Ce qui est impossible est grisé et dit pourquoi.

| Ordre | Ce qu'il fait |
|---|---|
| **Travailler ici** | tient un poste et fait produire la salle |
| **Nettoyer / recycler** | retire la saleté et la porte à la cuve à déchets |
| **Réparer** | rend de l'intégrité, consomme des matériaux |
| **Défendre** | reste dans la salle sans y travailler |
| **Attaquer** | grisé tant qu'il n'y a pas d'hostiles |

Deuxième chemin pour les mêmes gestes : dans la fiche d'une salle, un **poste
vide s'ouvre d'un clic** sur la liste de ceux qui ne font rien, classée par ce
que chacun vaut dans cette salle-là.

- **Neuf salles** qui réclament des postes, du courant et des réserves.
- **Les machines produisent toute l'énergie**, tout le reste en consomme. Quand
  l'offre ne suffit plus, les salles tombent par ordre de priorité — le moteur
  d'abord, la ferme en dernier. La salle de vie ne se coupe jamais.
- **Ils se débrouillent seuls.** Un clone épuisé quitte son poste pour la
  salle de vie et y revient une fois reposé ; un affamé va manger puis
  retourne travailler. Son poste lui reste **réservé** — le plan écrit
  `1(2)/2` pour dire « un présent, un au lit ». Quatre places seulement.
- **Une salle à moitié tenue tourne à moitié**, elle ne s'arrête pas — et elle
  ne tire que la moitié du courant.
- **Les déchets naissent où sont les gens**, salle par salle. Rien ne descend
  dans la cuve tout seul : il faut envoyer quelqu'un **nettoyer**. Et c'est de
  cette cuve que le recyclage tire l'eau et la matière — le balai est la source
  des matériaux.
- **Les salles s'usent**, et se salissent. Sous 12 % d'intégrité elles ne
  redémarrent plus ; au-delà de 40 de saleté elles rendent jusqu'à 30 % de
  moins. Mais **une salle où quelqu'un travaille s'entretient d'elle-même** :
  c'est la salle abandonnée qui se dégrade vraiment.
- **Le cycle se boucle** : la ferme boit de l'eau et rend vivres et oxygène ; le
  recyclage rend l'eau grise et tire des matériaux des déchets. Les corps font
  des déchets rien qu'en vivant, et les morts aussi.
- **Les clones ne sont pas des unités.** Le souvenir donne les compétences : le
  soudeur est bon en mécanique, la maraîchère en botanique. Fatigue, faim, santé
  et moral multiplient ce qu'ils valent à leur poste.
- **La cuve** : 80 matériaux, 10 jours, un poste tenu. La seule façon d'être plus
  nombreux — et les matériaux ne viennent que du recyclage.
- **Deux fins** : le premier relais atteint, ou l'extinction.

**Chaque salle dit ce qu'elle fait**, en une ligne sous son nom : un débit
pour ce qui ne finit jamais (`+13 en/j`), ou l'avancement d'un chantier qui
aura une fin — une cuve, une réparation, un ménage — avec ce qu'il reste à
tenir. Le temps est compté **en jours**, pas en minutes : une minute réelle ne
veut rien dire quand on passe de ×1 à ×16 quand on veut.

**Le vaisseau respire, et ça se voit.** Chaque fois qu'une salle produit, un
trait lumineux part d'elle, longe la coursive et va se jeter dans la jauge
concernée. Ce qui se consomme fait le trajet inverse, en plus sombre. Des
chiffres popent dans la salle au départ et sur la jauge à l'arrivée — et en
rouge quand une réserve pleine déborde, parce que remplir une cuve pleine c'est
jeter ce qu'on vient de produire.

**L'équipage parle.** Des banalités quand tout va, de l'incompréhension envers
« la machine » quand une salle est sale, vide ou cassée — ils ne savent pas
qu'un esprit humain les dirige — et de l'admiration quand le bord est propre.
Deux bulles au maximum, et un bouton **MICRO** pour les couper.

Commandes : **Espace** pause, **1 2 3** vitesses. Clic sur une salle ou sur un
point pour ouvrir sa fiche ; glisser un point pour lui donner un ordre.

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
| `js/08-effets.js` | 300 | les traits lumineux, les chiffres qui popent, les bulles |

Tout se compte **en jours de jeu**, déplacements compris : la simulation ne
dépend pas de la vitesse d'affichage.

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
jamais tenu. Le relais est maintenant atteint au jour 408 **avec un pilote
médiocre** — un joueur attentif ira beaucoup plus vite.

Il a aussi trouvé deux bugs strictement invisibles à l'œil : le pilote appelait
un ordre qui n'existait plus (donc il ne réparait ni ne nettoyait, et plusieurs
réglages ont été décidés sur un test faux), et la constante `REPARE_MAT`
n'avait jamais été écrite dans la config — elle valait `undefined`, ce qui
mettait l'intégrité des salles **et** la réserve de matériaux à `NaN`. La
fonction `retire()` refuse désormais toute valeur non finie et le dit dans le
journal de bord.
