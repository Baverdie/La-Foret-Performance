import prisma from './prisma';

export interface PublicMember {
  id: string;
  name: string;
  instagram: string;
  photo: string;
  bio: string;
  cars: PublicCar[];
  createdAt: string;
}

export interface PublicCar {
  id: string;
  model: string;
  year: string;
  photos: string[];
  containPhotos: number[];
  engine: string;
  power: string;
  modifications: string;
  story: string;
  owner: string;
  ownerInstagram: string;
}

export interface PublicEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  photo: string | null;
  status: 'past' | 'upcoming';
}

export async function getPublicMembers(): Promise<PublicMember[]> {
  const members = await prisma.member.findMany({
    where: { isActive: true },
    include: {
      cars: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  return members.map((member) => ({
    id: member.id,
    name: member.name,
    instagram: member.instagram,
    photo: member.photo,
    bio: member.bio,
    createdAt: member.createdAt.toISOString(),
    cars: member.cars.map((car) => ({
      id: car.id,
      model: car.model,
      year: car.year,
      photos: car.photos,
      containPhotos: car.containPhotos,
      engine: car.engine,
      power: car.power,
      modifications: car.modifications,
      story: car.story,
      owner: member.name,
      ownerInstagram: member.instagram,
    })),
  }));
}

export async function getPublicCars(): Promise<PublicCar[]> {
  const cars = await prisma.car.findMany({
    where: { isActive: true },
    include: {
      member: true,
    },
    orderBy: { order: 'asc' },
  });

  return cars.map((car) => ({
    id: car.id,
    model: car.model,
    year: car.year,
    photos: car.photos,
    containPhotos: car.containPhotos,
    engine: car.engine,
    power: car.power,
    modifications: car.modifications,
    story: car.story,
    owner: car.member.name,
    ownerInstagram: car.member.instagram,
  }));
}

export async function getPublicEvents(): Promise<PublicEvent[]> {
  const events = await prisma.event.findMany({
    orderBy: { date: 'desc' },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return events.map((event) => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    const status: 'past' | 'upcoming' = eventDate < now ? 'past' : 'upcoming';

    return {
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      location: event.location,
      description: event.description,
      photo: event.photo,
      status,
    };
  });
}

export interface PublicVariant {
  id: string;
  label: string;
  size: string | null;
  color: string | null;
  priceDelta: number;
  isSoldOut: boolean;
}

export interface PublicCampaign {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string[];
  category: string;
  images: string[];
  basePrice: number;
  availabilityMode: string;
  hasVariants: boolean;
  variants: PublicVariant[];
  campaign: PublicCampaign | null;
  salesCount: number; // unités vendues (commandes payées) — merchandising
}

// Statuts de commande comptés comme une vente réelle.
const SOLD_STATUSES = ['PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'];

// Agrège les unités vendues (commandes payées) par produit, pour une liste d'ids.
// Parametre: productIds (ids des produits concernés).
// Sortie: Map productId -> quantité totale vendue.
async function salesCountByProduct(productIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (productIds.length === 0) return result;

  const items = await prisma.orderItem.findMany({
    where: { productId: { in: productIds }, order: { status: { in: SOLD_STATUSES } } },
    select: { productId: true, quantity: true },
  });
  for (const item of items) {
    result.set(item.productId, (result.get(item.productId) || 0) + item.quantity);
  }
  return result;
}

// Indique si une variante a atteint sa limite de stock optionnelle (drop limite).
// Parametres: stockLimit (limite ou null), soldQuantity (quantite deja commandee payee).
// Sortie: true si la variante est epuisee.
function isVariantSoldOut(stockLimit: number | null, soldQuantity: number): boolean {
  if (stockLimit === null || stockLimit === undefined) {
    return false;
  }
  return soldQuantity >= stockLimit;
}

// Determine si un produit est disponible a la vente selon son mode et l'etat de sa campagne.
// Un produit en precommande n'est achetable que si sa campagne est OPEN.
function isProductPurchasable(
  availabilityMode: string,
  campaignStatus: string | undefined
): boolean {
  if (availabilityMode === 'PRECOMMANDE') {
    return campaignStatus === 'OPEN';
  }
  return true;
}

type ProductWithRelations = {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string[];
  category: string;
  images: string[];
  basePrice: number;
  availabilityMode: string;
  hasVariants: boolean;
  variants: { id: string; label: string; size: string | null; color: string | null; priceDelta: number; stockLimit: number | null }[];
  campaign: { id: string; name: string; description: string; startDate: Date; endDate: Date; status: string } | null;
};

// Mappe un produit Prisma (avec variantes et campagne) vers sa representation publique.
// Calcule l'etat "epuise" de chaque variante a partir des quantites deja commandees payees.
// Parametre salesCount : unités vendues du produit (merchandising), 0 par défaut.
async function mapProductToPublic(product: ProductWithRelations, salesCount = 0): Promise<PublicProduct> {
  const limitedVariantIds = product.variants
    .filter((variant) => variant.stockLimit !== null && variant.stockLimit !== undefined)
    .map((variant) => variant.id);

  const soldByVariant = new Map<string, number>();
  if (limitedVariantIds.length > 0) {
    const soldItems = await prisma.orderItem.findMany({
      where: {
        variantId: { in: limitedVariantIds },
        order: { status: { in: ['PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'] } },
      },
      select: { variantId: true, quantity: true },
    });
    for (const item of soldItems) {
      if (item.variantId) {
        soldByVariant.set(item.variantId, (soldByVariant.get(item.variantId) || 0) + item.quantity);
      }
    }
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    details: product.details,
    category: product.category,
    images: product.images,
    basePrice: product.basePrice,
    availabilityMode: product.availabilityMode,
    hasVariants: product.hasVariants,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      size: variant.size,
      color: variant.color,
      priceDelta: variant.priceDelta,
      isSoldOut: isVariantSoldOut(variant.stockLimit, soldByVariant.get(variant.id) || 0),
    })),
    campaign: product.campaign
      ? {
          id: product.campaign.id,
          name: product.campaign.name,
          description: product.campaign.description,
          startDate: product.campaign.startDate.toISOString(),
          endDate: product.campaign.endDate.toISOString(),
        }
      : null,
    salesCount,
  };
}

// Recupere les produits publics achetables, filtres optionnellement par categorie.
// Parametre: category (optionnel, filtre de categorie).
// Sortie: liste de PublicProduct (champs publics uniquement), tries par ordre d'affichage.
export async function getShopProducts(category?: string): Promise<PublicProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
    },
    include: {
      campaign: true,
      variants: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  const purchasable = products.filter((product) =>
    isProductPurchasable(product.availabilityMode, product.campaign?.status)
  );

  // Merchandising : tri par best-sellers (unités vendues décroissantes),
  // l'ordre manuel défini en admin servant de départage (utile quand aucune vente).
  const sales = await salesCountByProduct(purchasable.map((p) => p.id));
  purchasable.sort(
    (a, b) => (sales.get(b.id) || 0) - (sales.get(a.id) || 0) || a.order - b.order
  );

  return Promise.all(purchasable.map((product) => mapProductToPublic(product, sales.get(product.id) || 0)));
}

// Recupere un produit public par son slug (ou null si introuvable/inactif/non achetable).
// Parametre: slug (identifiant URL du produit).
// Sortie: PublicProduct ou null.
export async function getShopProductBySlug(slug: string): Promise<PublicProduct | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      campaign: true,
      variants: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (
    !product ||
    !product.isActive ||
    !isProductPurchasable(product.availabilityMode, product.campaign?.status)
  ) {
    return null;
  }

  return mapProductToPublic(product);
}

// Recupere les campagnes de precommande actuellement ouvertes.
// Sortie: liste de PublicCampaign triees par date de fin croissante.
export async function getActiveCampaigns(): Promise<PublicCampaign[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: 'OPEN' },
    orderBy: { endDate: 'asc' },
  });

  return campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate.toISOString(),
  }));
}
