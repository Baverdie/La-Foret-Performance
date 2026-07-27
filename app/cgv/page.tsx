import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
	title: 'Conditions générales de vente — La Forêt Performance',
	robots: { index: false },
};

// Conditions générales de vente de la boutique. Les champs [À COMPLÉTER] doivent être
// renseignés (identité du vendeur, médiateur de la consommation) avant mise en production.
export default function CgvPage() {
	return (
		<LegalPage title="Conditions générales de vente" updated="8 juillet 2026">
			<h2>Article 1 — Objet et champ d'application</h2>
			<p>
				Les présentes conditions générales de vente (« CGV ») régissent l'ensemble des ventes conclues
				sur la boutique en ligne du site <strong>laforetperformance.fr</strong> (« la Boutique ») entre
				<strong> [À COMPLÉTER : dénomination du vendeur, forme, SIREN, adresse]</strong> (« le Vendeur »)
				et toute personne physique agissant en qualité de consommateur (« le Client »). Toute commande
				implique l'acceptation sans réserve des présentes CGV, matérialisée au moment du paiement.
			</p>

			<h2>Article 2 — Produits</h2>
			<p>
				La Boutique propose des articles textiles et accessoires (t-shirts, sweats, casquettes,
				autocollants, cache-plaques…). Les visuels des produits sont aussi fidèles que possible ;
				des variations mineures (teinte, rendu d'impression) peuvent exister et ne constituent pas
				un défaut de conformité.
			</p>
			<p>
				<strong>Production à la demande et précommande :</strong> afin d'éviter le surplus, les articles
				sont produits à la commande, ou par vagues de précommande. Dans ce dernier cas, la période de
				commande et la date de clôture sont affichées sur la fiche produit ; la production est lancée
				à la clôture de la campagne.
			</p>

			<h2>Article 3 — Prix</h2>
			<p>
				Les prix sont exprimés en euros, toutes taxes comprises, hors frais de livraison et frais de
				traitement. Les frais de livraison ainsi que des frais de traitement de la commande, identiques
				quel que soit le moyen de paiement utilisé, sont affichés avant validation de la commande. Le
				Vendeur se réserve le droit de modifier ses prix à tout moment ; les produits sont facturés au
				tarif en vigueur au moment de la validation de la commande.
			</p>

			<h2>Article 4 — Commande et paiement</h2>
			<p>
				La commande s'effectue en ligne, sans création de compte. Le paiement est exigible immédiatement
				et s'effectue par carte bancaire via la plateforme sécurisée <strong>Stripe</strong> ; le Vendeur
				n'a jamais accès aux données de carte. La commande n'est définitive qu'après confirmation du
				paiement, matérialisée par un email de confirmation.
			</p>

			<h2>Article 5 — Livraison</h2>
			<p>
				Les commandes sont expédiées à l'adresse de livraison indiquée par le Client, en France
				métropolitaine. Les délais indicatifs sont les suivants :
			</p>
			<ul>
				<li>Articles à la demande : production puis expédition sous <strong>[À COMPLÉTER : X à Y jours ouvrés]</strong>.</li>
				<li>Précommandes : production lancée à la clôture de la campagne, expédition sous <strong>[À COMPLÉTER : X semaines]</strong> après clôture.</li>
			</ul>
			<p>
				En cas de retard de livraison de plus de sept jours par rapport au délai annoncé, le Client peut
				enjoindre le Vendeur d'effectuer la livraison dans un délai supplémentaire raisonnable, puis
				résoudre la commande si la livraison n'intervient pas (art. L216-2 du Code de la consommation).
			</p>

			<h2>Article 6 — Droit de rétractation</h2>
			<p>
				Conformément aux articles L221-18 et suivants du Code de la consommation, le Client dispose d'un
				délai de <strong>quatorze (14) jours</strong> à compter de la réception de sa commande pour
				exercer son droit de rétractation, sans avoir à motiver sa décision. La demande s'effectue par
				email à <strong>[À COMPLÉTER : email de contact]</strong>.
			</p>
			<p>
				Les articles doivent être retournés dans leur état d'origine, non portés et non lavés, dans un
				délai de 14 jours suivant la notification. Les frais de retour restent à la charge du Client.
				Le remboursement (produit + livraison initiale standard) intervient dans les 14 jours suivant
				la récupération des articles, via le moyen de paiement d'origine.
			</p>
			<p>
				<strong>Exception :</strong> conformément à l'article L221-28 3° du Code de la consommation, le
				droit de rétractation ne peut être exercé pour les biens confectionnés selon les spécifications
				du consommateur ou nettement personnalisés (ex. article personnalisé au nom du Client).
			</p>

			<h2>Article 7 — Garanties légales</h2>
			<p>
				Tous les produits bénéficient de la garantie légale de conformité (art. L217-3 et suivants du
				Code de la consommation, deux ans à compter de la délivrance) et de la garantie des vices cachés
				(art. 1641 et suivants du Code civil). En cas de non-conformité, le Client peut choisir entre la
				réparation et le remplacement du bien, ou à défaut la réduction du prix ou la résolution de la
				vente, sans frais.
			</p>

			<h2>Article 8 — Service client et réclamations</h2>
			<p>
				Pour toute question ou réclamation : <strong>[À COMPLÉTER : email de contact]</strong>. Le
				Vendeur s'engage à répondre dans un délai raisonnable.
			</p>

			<h2>Article 9 — Médiation de la consommation</h2>
			<p>
				Conformément à l'article L612-1 du Code de la consommation, le Client peut recourir gratuitement
				à un médiateur de la consommation en cas de litige non résolu :
				<strong> [À COMPLÉTER : nom et coordonnées du médiateur désigné]</strong>. Le Client peut
				également utiliser la plateforme européenne de règlement en ligne des litiges :
				<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"> ec.europa.eu/consumers/odr</a>.
			</p>

			<h2>Article 10 — Données personnelles</h2>
			<p>
				Le traitement des données personnelles du Client est décrit dans la
				<a href="/confidentialite"> politique de confidentialité</a>.
			</p>

			<h2>Article 11 — Droit applicable</h2>
			<p>
				Les présentes CGV sont soumises au droit français. En l'absence de résolution amiable, tout
				litige relève des juridictions françaises compétentes.
			</p>
		</LegalPage>
	);
}
