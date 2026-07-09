import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
	title: 'Politique de confidentialité — La Forêt Performance',
	robots: { index: false },
};

// Politique de confidentialité (RGPD). Le responsable de traitement [À COMPLÉTER]
// doit être renseigné avant mise en production.
export default function ConfidentialitePage() {
	return (
		<LegalPage title="Politique de confidentialité" updated="8 juillet 2026">
			<h2>Responsable de traitement</h2>
			<p>
				Les données personnelles collectées sur le site sont traitées par
				<strong> [À COMPLÉTER : dénomination + coordonnées du responsable de traitement]</strong>,
				joignable à <strong>[À COMPLÉTER : email]</strong>.
			</p>

			<h2>Données collectées et finalités</h2>
			<h3>Commandes de la boutique</h3>
			<p>
				Lors d'une commande, nous collectons : nom, prénom, adresse email, adresse de livraison et
				numéro de téléphone (facultatif). Ces données servent exclusivement au
				<strong> traitement et à la livraison de la commande</strong> (base légale : exécution du
				contrat) ainsi qu'à l'envoi des emails transactionnels (confirmation, expédition).
			</p>
			<h3>Paiement</h3>
			<p>
				Les paiements sont traités par <strong>Stripe</strong> (Stripe Payments Europe Ltd). Les données
				de carte bancaire sont saisies directement sur la plateforme de Stripe et ne transitent jamais
				par nos serveurs. Voir la <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer">politique de confidentialité de Stripe</a>.
			</p>
			<h3>Panier</h3>
			<p>
				Le contenu du panier est stocké localement dans votre navigateur (localStorage) et n'est
				transmis à nos serveurs qu'au moment de la commande. Aucun traceur publicitaire ni cookie
				tiers n'est utilisé.
			</p>

			<h2>Destinataires des données</h2>
			<ul>
				<li><strong>Stripe</strong> — traitement du paiement.</li>
				<li><strong>Le transporteur</strong> — livraison de la commande (nom, adresse, téléphone).</li>
				<li><strong>Vercel / MongoDB Atlas</strong> — hébergement technique du site et des données.</li>
			</ul>
			<p>Aucune donnée n'est vendue ni transmise à des tiers à des fins commerciales.</p>

			<h2>Durées de conservation</h2>
			<ul>
				<li>Données de commande : <strong>10 ans</strong> (obligations comptables et fiscales).</li>
				<li>Panier local : conservé dans votre navigateur jusqu'à suppression par vos soins.</li>
			</ul>

			<h2>Vos droits</h2>
			<p>
				Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de
				rectification, d'effacement, de limitation, d'opposition et de portabilité sur vos données.
				Pour l'exercer : <strong>[À COMPLÉTER : email]</strong>. Vous pouvez également introduire une
				réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr</a>).
			</p>

			<h2>Sécurité</h2>
			<p>
				Les échanges avec le site sont chiffrés (HTTPS). L'accès aux données de commande est restreint
				aux personnes habilitées à la gestion de la boutique, via un espace d'administration protégé
				par authentification.
			</p>
		</LegalPage>
	);
}
