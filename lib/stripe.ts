import Stripe from 'stripe';

// Instance Stripe mise en cache (initialisation paresseuse).
let cachedClient: Stripe | null = null;

// Retourne le client Stripe, instancie au premier appel uniquement.
// On evite toute instanciation au chargement du module pour ne pas casser le build
// quand la cle n'est pas presente (collecte des routes par Next). Lance une erreur
// explicite a l'usage si la cle secrete manque. Version d'API laissee par defaut du SDK.
export function getStripe(): Stripe {
  if (cachedClient) {
    return cachedClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY manquante dans les variables d\'environnement');
  }

  cachedClient = new Stripe(secretKey);
  return cachedClient;
}
