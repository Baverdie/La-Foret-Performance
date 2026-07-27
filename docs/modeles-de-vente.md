# Modèles de vente — Boutique LFP

*Document de travail pour discussion avec le crew — juillet 2026*

---

## L'idée générale

Chaque produit de la boutique se définit par la combinaison de **trois axes indépendants** :

| Axe | Options |
|---|---|
| **Disponibilité** | En stock · À produire · Précommande (fenêtre datée) |
| **Déclenchement de la production** | À la vente · À la clôture de campagne · Par lot manuel (ex. fin de mois) |
| **Livraison** | Postale *(retrait sur place : envisageable plus tard si events)* |

Tous les modèles ci-dessous sont des combinaisons de ces trois axes — pas besoin d'une usine à gaz, un seul système les couvre tous.

---

## Vue d'ensemble des 5 modèles

| # | Modèle | Ce que voit le client | Ce que fait le crew | État |
|---|---|---|---|---|
| 1 | **Stock** | « En stock » → achat → expédition rapide | Produit en avance, réapprovisionne quand il veut | 🔨 À construire |
| 2 | **Précommande** | Fenêtre de commande avec dates de campagne | Clôture la campagne → produit la quantité exacte commandée | ✅ Déjà en place |
| 3 | **À la demande (par lots)** | « Produit à la commande — délai 2 à 3 semaines » | Lance la production groupée quand ça l'arrange (ex. fin de mois), avec feuille de production | 🔶 Partiel |
| 4 | **Drop numéroté** | « Édition limitée — 50 exemplaires », numéro attribué à l'achat | Production numérotée physiquement (ex. brodé « 12/50 »), jamais réédité | 🔨 À construire |
| 5 | **Hybride stock → demande** | « En stock » puis, à épuisement, « à la demande — délai X » | Vend le stock, puis produit à la demande : aucune vente perdue | 🔨 À construire |

---

## Détail par modèle

### 1. Stock — vendre jusqu'à épuisement ou réapprovisionnement

- **Principe** : le crew produit en avance, la boutique décompte à chaque vente.
- **Client** : achat immédiat, expédition rapide (pas de délai de production).
- **Admin** : champ stock par taille/couleur, réapprovisionnement en deux clics.
- **Anti-survente** : le stock est réservé dès la création de la commande et automatiquement remis si le paiement expire ou est annulé — impossible de vendre deux fois le dernier hoodie.
- **Idéal pour** : stickers, cache-plaques, petites pièces peu coûteuses à produire d'avance.

### 2. Précommande par campagne ✅

- **Principe** : fenêtre de commande datée ; à la clôture, on produit exactement ce qui a été commandé. Zéro surplus, zéro stock dormant.
- **Client** : bandeau précommande, dates affichées, email quand la production démarre.
- **Admin** : campagnes avec statuts (brouillon → ouverte → clôturée → en production → terminée), quantités agrégées par produit/taille, bascule groupée de toutes les commandes avec email automatique à chaque client.
- **Idéal pour** : les grosses pièces (hoodies, vestes), les collections saisonnières.

### 3. Production à la demande, par lots

- **Principe** : le produit est commandable en permanence ; le crew regroupe les commandes payées et lance la production quand il veut — fin de mois, ou dès qu'il y en a assez.
- **Client** : délai annoncé sur la fiche produit (« produit à la commande, 2 à 3 semaines »).
- **Admin** : un bouton « Lancer la production » qui bascule d'un coup toutes les commandes payées en attente + une **feuille de production** agrégée (ex. 4× M noir, 2× L sable) à envoyer à l'imprimeur.
- **Note** : la production par *seuil* (« dès 10 commandes ») a été écartée — une commande isolée pourrait attendre des mois, pas viable.
- **Idéal pour** : le catalogue permanent sans immobiliser d'argent en stock.

### 4. Drop limité numéroté

- **Principe** : édition unique de N exemplaires, numérotés **physiquement sur le produit** (ex. brodé « 12/50 »). Sold out définitif, jamais réédité.
- **Client** : « Édition limitée — 50 exemplaires », numéro attribué dans l'ordre des paiements, communiqué dans l'email de confirmation et le suivi de commande.
- **Admin** : taille d'édition fixée à la création du produit ; la feuille de production porte le numéro de chaque exemplaire pour le fabricant.
- **Effet** : la rareté réelle crée l'événement — cohérent avec l'esprit drop déjà en place sur la boutique.
- **Idéal pour** : pièces collector, collabs, anniversaires du crew.

### 5. Hybride stock → à la demande

- **Principe** : le meilleur des deux mondes. Tant qu'il y a du stock : expédition rapide. Stock épuisé : le produit **bascule automatiquement** en production à la demande au lieu d'afficher « épuisé ».
- **Client** : le badge passe de « En stock » à « Produit à la commande — délai X » sans interruption de vente.
- **Admin** : rien à faire, la bascule est automatique ; chaque ligne de commande indique si elle vient du stock ou part en production.
- **Idéal pour** : les best-sellers du catalogue permanent.

---

## Modèles écartés (et pourquoi)

| Modèle | Raison |
|---|---|
| Production par seuil (« dès 10 commandes ») | Une commande peut attendre des mois si le seuil n'est jamais atteint — pas viable |
| Retrait à la sortie / click & collect | Pas d'events organisés pour l'instant — à reconsidérer plus tard |
| Personnalisation (pseudo, plaque perso…) | Dilue la marque LFP — refusé |

---

## Questions à trancher ensemble

1. **Affichage du stock** sur la fiche produit :
   - a) « En stock » / « Épuisé » uniquement (sobre)
   - b) le vrai chiffre quand il en reste peu — « Plus que 3 » (recommandé : c'est du réel, pas de fausse urgence)
   - c) toujours le chiffre exact (transparent mais révèle les volumes)
2. **Délai annoncé** pour la production à la demande : 2–3 semaines ? Configurable par produit ?
3. **Cadence des lots** : fin de mois fixe, ou « quand ça arrange » ?
4. **Éditions numérotées** : quelle taille (30 ? 50 ?) et quelle fréquence de drops ?
5. **Quel modèle pour quels produits au lancement ?** Proposition de départ :
   - Stickers / cache-plaques → **Stock**
   - T-shirts / hoodies permanents → **À la demande (lots)** ou **Hybride**
   - Pièces événement → **Précommande** ou **Drop numéroté**

---

## Ordre de construction proposé (après validation)

1. **Stock réel** + réapprovisionnement admin — le socle manquant
2. **Hybride** — petite extension du stock
3. **Drops numérotés** — numérotation + feuille de production
4. **Lots groupés** — bouton production groupée + feuille de production agrégée

*Le tout s'appuie sur l'existant (commandes, statuts, emails, remboursements) — pas de refonte.*
