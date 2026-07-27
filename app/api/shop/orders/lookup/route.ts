import { NextRequest, NextResponse } from 'next/server';
import { findOrderByNumberAndEmail, toPublicOrderView } from '@/lib/shop/order-lookup';
import { SHOP_ENABLED } from '@/lib/shop/flags';

export const runtime = 'nodejs';

// POST : recherche publique d'une commande pour la page « Suivre ma commande ».
// Corps attendu : { orderNumber, email }. Reponse identique que le numero existe
// ou que l'email ne corresponde pas (pas de fuite d'information).
export async function POST(request: NextRequest) {
  // Boutique désactivée (flag) : l'API de suivi est inaccessible.
  if (!SHOP_ENABLED) {
    return NextResponse.json({ error: 'Boutique indisponible' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const order = await findOrderByNumberAndEmail(String(body.orderNumber || ''), String(body.email || ''));

    if (!order) {
      return NextResponse.json(
        { error: 'Aucune commande ne correspond à ce numéro et cet email' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order: toPublicOrderView(order) });
  } catch (error) {
    console.error('Error looking up order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
