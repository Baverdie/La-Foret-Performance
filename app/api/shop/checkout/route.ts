import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { computeOrderTotals, type ResolvedOrderLine, type CheckoutItemInput } from '@/lib/shop/cart';

export const runtime = 'nodejs';

// URL publique de l'application (pour les redirections Stripe).
const APP_URL =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');

// Coordonnees client attendues au checkout.
interface CustomerInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country?: string;
}

// Valide le format d'une adresse email.
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Verifie que toutes les coordonnees de livraison obligatoires sont presentes et valides.
function validateCustomer(customer: CustomerInput | undefined): string | null {
  if (!customer) return 'Coordonnées manquantes';
  if (!isValidEmail(customer.email)) return 'Email invalide';
  if (!customer.firstName?.trim() || !customer.lastName?.trim()) return 'Nom et prénom requis';
  if (!customer.addressLine1?.trim()) return 'Adresse requise';
  if (!customer.city?.trim()) return 'Ville requise';
  if (!customer.postalCode?.trim()) return 'Code postal requis';
  return null;
}

// Genere un numero de commande lisible : LFP-<annee>-<sequence sur 4 chiffres>.
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const count = await prisma.order.count({ where: { createdAt: { gte: startOfYear } } });
  return `LFP-${year}-${String(count + 1).padStart(4, '0')}`;
}

// POST : valide le panier, recalcule les prix cote serveur, cree une commande PENDING
// puis une session Stripe Checkout. Renvoie l'URL de paiement hebergee par Stripe.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: CheckoutItemInput[] = Array.isArray(body.items) ? body.items : [];
    const customer: CustomerInput = body.customer;

    if (items.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 });
    }

    const customerError = validateCustomer(customer);
    if (customerError) {
      return NextResponse.json({ error: customerError }, { status: 400 });
    }

    // Recuperation des produits concernes (avec variantes et campagne) en une requete.
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true, campaign: true },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    // Resolution et validation de chaque ligne avec recalcul des prix de confiance.
    const lines: ResolvedOrderLine[] = [];
    const campaignIds = new Set<string>();

    for (const item of items) {
      const quantity = Math.floor(Number(item.quantity));
      if (!quantity || quantity < 1) {
        return NextResponse.json({ error: 'Quantité invalide' }, { status: 400 });
      }

      const product = productMap.get(item.productId);
      if (!product || !product.isActive) {
        return NextResponse.json({ error: 'Produit indisponible' }, { status: 400 });
      }

      // Mode precommande : la campagne doit etre ouverte.
      if (product.availabilityMode === 'PRECOMMANDE') {
        if (!product.campaign || product.campaign.status !== 'OPEN') {
          return NextResponse.json(
            { error: `La précommande pour « ${product.name} » est fermée` },
            { status: 400 }
          );
        }
        campaignIds.add(product.campaign.id);
      }

      let unitPrice = product.basePrice;
      let variantId: string | null = null;
      let variantLabel: string | null = null;

      if (product.hasVariants) {
        if (!item.variantId) {
          return NextResponse.json(
            { error: `Veuillez choisir une variante pour « ${product.name} »` },
            { status: 400 }
          );
        }
        const variant = product.variants.find((v) => v.id === item.variantId && v.isActive);
        if (!variant) {
          return NextResponse.json({ error: 'Variante indisponible' }, { status: 400 });
        }
        unitPrice = product.basePrice + variant.priceDelta;
        variantId = variant.id;
        variantLabel = variant.label;
      }

      lines.push({
        productId: product.id,
        productName: product.name,
        variantId,
        variantLabel,
        unitPrice,
        quantity,
        lineTotal: unitPrice * quantity,
      });
    }

    // Une commande ne peut rattacher qu'une seule campagne de precommande (delais homogenes).
    if (campaignIds.size > 1) {
      return NextResponse.json(
        { error: 'Impossible de mélanger plusieurs précommandes dans une même commande' },
        { status: 400 }
      );
    }
    const campaignId = campaignIds.size === 1 ? [...campaignIds][0] : null;

    const totals = computeOrderTotals(lines);
    const orderNumber = await generateOrderNumber();

    // Creation de la commande en attente de paiement.
    const order = await prisma.order.create({
      data: {
        orderNumber,
        email: customer.email.trim().toLowerCase(),
        firstName: customer.firstName.trim(),
        lastName: customer.lastName.trim(),
        phone: customer.phone?.trim() || null,
        addressLine1: customer.addressLine1.trim(),
        addressLine2: customer.addressLine2?.trim() || null,
        city: customer.city.trim(),
        postalCode: customer.postalCode.trim(),
        country: customer.country?.trim() || 'FR',
        subtotal: totals.subtotal,
        shippingCost: totals.shippingCost,
        total: totals.total,
        status: 'PENDING',
        campaignId,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            productName: line.productName,
            variantLabel: line.variantLabel,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          })),
        },
      },
    });

    // Creation de la session Stripe Checkout.
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: order.email,
      line_items: lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: 'eur',
          unit_amount: line.unitPrice,
          product_data: {
            name: line.variantLabel ? `${line.productName} — ${line.variantLabel}` : line.productName,
          },
        },
      })),
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            display_name: 'Frais de port',
            fixed_amount: { amount: totals.shippingCost, currency: 'eur' },
          },
        },
      ],
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      success_url: `${APP_URL}/shop/commande/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/shop/panier?canceled=1`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error during checkout:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 500 });
  }
}
