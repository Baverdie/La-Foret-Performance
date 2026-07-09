import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';

export const metadata: Metadata = {
	title: 'Mentions légales — La Forêt Performance',
	robots: { index: false },
};

// Page des mentions légales (art. 6 III-1 LCEN). Les champs [À COMPLÉTER] doivent être
// renseignés avec les informations réelles de la structure avant mise en production.
export default function MentionsLegalesPage() {
	return (
		<LegalPage title="Mentions légales" updated="8 juillet 2026">
			<h2>Éditeur du site</h2>
			<p>
				Le site <strong>laforetperformance.fr</strong> (ci-après « le Site ») est édité par :
			</p>
			<ul>
				<li><strong>[À COMPLÉTER : dénomination — association loi 1901 / entreprise individuelle / société]</strong></li>
				<li>Siège : <strong>[À COMPLÉTER : adresse complète]</strong></li>
				<li>SIREN / RNA : <strong>[À COMPLÉTER]</strong></li>
				<li>Email : <strong>[À COMPLÉTER : adresse de contact]</strong></li>
				<li>Directeur de la publication : <strong>[À COMPLÉTER : nom du responsable]</strong></li>
			</ul>

			<h2>Hébergement</h2>
			<p>
				Le Site est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723,
				États-Unis — <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>.
			</p>
			<p>
				Les données (catalogue, commandes) sont hébergées par <strong>MongoDB Atlas</strong> (MongoDB Inc.)
				et les images par <strong>Vercel Blob</strong>.
			</p>

			<h2>Propriété intellectuelle</h2>
			<p>
				L'ensemble des éléments du Site (logo, textes, photographies, visuels produits, charte graphique)
				est la propriété exclusive de La Forêt Performance ou de leurs auteurs respectifs. Toute
				reproduction, représentation ou exploitation, totale ou partielle, sans autorisation écrite
				préalable est interdite.
			</p>

			<h2>Responsabilité</h2>
			<p>
				L'éditeur s'efforce d'assurer l'exactitude des informations publiées sur le Site mais ne saurait
				être tenu responsable des omissions, inexactitudes ou carences dans leur mise à jour. Les liens
				externes (notamment vers Instagram) ne sauraient engager la responsabilité de l'éditeur quant à
				leur contenu.
			</p>

			<h2>Contact</h2>
			<p>
				Pour toute question relative au Site : <strong>[À COMPLÉTER : email de contact]</strong> ou via
				Instagram <a href="https://instagram.com/la.foret.performance" target="_blank" rel="noopener noreferrer">@la.foret.performance</a>.
			</p>
		</LegalPage>
	);
}
