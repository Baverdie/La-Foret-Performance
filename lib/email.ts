import nodemailer from 'nodemailer';
import { formatEuros } from './shop/format';

const FROM_EMAIL = process.env.SMTP_FROM || 'LFP Admin <noreply@laforetperformance.fr>';
const APP_URL = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3002');

function createTransporter() {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPasswordSetupEmail(
  email: string,
  name: string,
  token: string
) {
  const setupUrl = `${APP_URL}/admin/setup-password?token=${token}`;
  const transporter = createTransporter();

  if (!transporter) {
    return { success: true, data: { id: 'dev-mode' } };
  }

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: 'Bienvenue sur LFP Admin - Definissez votre mot de passe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue sur LFP</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000000;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <img src="https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/logo-lfp.jpg" alt="LFP" width="80" height="80" style="border-radius: 50%; border: 2px solid #333333; display: block;" />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 20px; overflow: hidden;">
                        <tr>
                          <td style="height: 2px; background: linear-gradient(90deg, #333333 0%, #ffffff 50%, #333333 100%);"></td>
                        </tr>
                        <tr>
                          <td style="padding: 48px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                              <tr>
                                <td style="background-color: rgba(255, 255, 255, 0.08); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.15);">
                                  <span style="color: #999999; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Nouveau compte</span>
                                </td>
                              </tr>
                            </table>
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.3;">
                              Bienvenue ${name} !
                            </h1>
                            <p style="color: #666666; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
                              Un compte administrateur a été créé pour vous sur le panel de gestion de <strong style="color: #888888;">La Forêt Performance</strong>.
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #111111; border-radius: 12px; margin-bottom: 32px;">
                              <tr>
                                <td style="padding: 20px;">
                                  <p style="color: #888888; font-size: 14px; line-height: 1.6; margin: 0;">
                                    Cliquez sur le bouton ci-dessous pour définir votre mot de passe et activer votre accès au panel d'administration.
                                  </p>
                                </td>
                              </tr>
                            </table>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td align="center">
                                  <a href="${setupUrl}" style="display: inline-block; background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%); color: #000000; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15);">
                                    Activer mon compte
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 40px 40px 40px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #1f1f1f; padding-top: 24px;">
                              <tr>
                                <td>
                                  <p style="color: #444444; font-size: 13px; line-height: 1.6; margin: 0;">
                                    <span style="color: #666666;">&#9679;</span> Ce lien expire dans <strong style="color: #666666;">24 heures</strong><br>
                                    <span style="color: #666666;">&#9679;</span> Si vous n'avez pas demandé ce compte, ignorez cet email
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top: 32px;">
                      <p style="color: #333333; font-size: 12px; margin: 0 0 8px 0;">
                        La Forêt Performance
                      </p>
                      <p style="color: #222222; font-size: 11px; margin: 0;">
                        Pâturages et belles mécaniques en Charente-Maritime
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    return { success: true, data: { id: info.messageId } };
  } catch (error) {
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${APP_URL}/admin/setup-password?token=${token}&reset=true`;
  const transporter = createTransporter();

  if (!transporter) {
    return { success: true, data: { id: 'dev-mode' } };
  }

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: 'LFP Admin - Reinitialisation de mot de passe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reinitialisation mot de passe</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #000000;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <img src="https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/logo-lfp.jpg" alt="LFP" width="80" height="80" style="border-radius: 50%; border: 2px solid #333333; display: block;" />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 20px; overflow: hidden;">
                        <tr>
                          <td style="height: 2px; background: linear-gradient(90deg, #333333 0%, #888888 50%, #333333 100%);"></td>
                        </tr>
                        <tr>
                          <td style="padding: 48px 40px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                              <tr>
                                <td style="background-color: rgba(255, 255, 255, 0.05); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                                  <span style="color: #888888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Sécurité</span>
                                </td>
                              </tr>
                            </table>
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.3;">
                              Réinitialisation du mot de passe
                            </h1>
                            <p style="color: #666666; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
                              Bonjour <strong style="color: #888888;">${name}</strong>, vous avez demandé à réinitialiser votre mot de passe pour accéder au panel d'administration.
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #111111; border-radius: 12px; margin-bottom: 32px;">
                              <tr>
                                <td style="padding: 20px;">
                                  <p style="color: #888888; font-size: 14px; line-height: 1.6; margin: 0;">
                                    Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe sécurisé.
                                  </p>
                                </td>
                              </tr>
                            </table>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td align="center">
                                  <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%); color: #000000; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15);">
                                    Nouveau mot de passe
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 40px 40px 40px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #1f1f1f; padding-top: 24px;">
                              <tr>
                                <td>
                                  <p style="color: #444444; font-size: 13px; line-height: 1.6; margin: 0;">
                                    <span style="color: #888888;">&#9679;</span> Ce lien expire dans <strong style="color: #666666;">1 heure</strong><br>
                                    <span style="color: #666666;">&#9679;</span> Si vous n'avez pas fait cette demande, ignorez cet email
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top: 32px;">
                      <p style="color: #333333; font-size: 12px; margin: 0 0 8px 0;">
                        La Forêt Performance
                      </p>
                      <p style="color: #222222; font-size: 11px; margin: 0;">
                        Paturages et belles mécaniques en Charente-Maritime
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return { success: true, data: { id: info.messageId } };
  } catch (error) {
    return { success: false, error };
  }
}

// Article d'une commande pour les emails.
interface OrderEmailItem {
  productName: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// Donnees minimales d'une commande necessaires aux emails.
interface OrderEmailData {
  orderNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string;
  country: string;
  subtotal: number;
  shippingCost: number;
  processingFee: number;
  total: number;
  trackingNumber?: string | null;
  items: OrderEmailItem[];
}

// Construit l'URL publique de la page de suivi, pré-remplie avec numéro et email.
function buildTrackingPageUrl(order: OrderEmailData): string {
  return `${APP_URL}/shop/commande?numero=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.email)}`;
}

// Construit l'URL de suivi La Poste pour un numéro de colis.
function buildLaPosteUrl(trackingNumber: string): string {
  return `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(trackingNumber)}`;
}

// Bouton d'action centré des emails boutique (blanc sur sombre, angles droits).
function renderEmailButton(href: string, label: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 8px;">
      <tr>
        <td align="center">
          <a href="${href}" style="display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; padding: 14px 36px; font-weight: 600; font-size: 14px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

// Construit les lignes HTML du recapitulatif d'articles d'une commande.
function renderOrderItemsRows(items: OrderEmailItem[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #262626; color: #cccccc; font-size: 14px;">
            ${item.productName}${item.variantLabel ? ` <span style="color:#777777;">(${item.variantLabel})</span>` : ''}
            <span style="color:#777777;"> × ${item.quantity}</span>
          </td>
          <td align="right" style="padding: 12px 0; border-bottom: 1px solid #262626; color: #ffffff; font-size: 14px; white-space: nowrap;">
            ${formatEuros(item.lineTotal)}
          </td>
        </tr>`
    )
    .join('');
}

// Construit le bloc HTML du recapitulatif des totaux et de l'adresse de livraison.
function renderOrderSummary(order: OrderEmailData): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      ${renderOrderItemsRows(order.items)}
      <tr>
        <td style="padding: 14px 0 4px 0; color: #8a8a8a; font-size: 14px;">Sous-total</td>
        <td align="right" style="padding: 14px 0 4px 0; color: #cccccc; font-size: 14px;">${formatEuros(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #8a8a8a; font-size: 14px;">Frais de port</td>
        <td align="right" style="padding: 4px 0; color: #cccccc; font-size: 14px;">${formatEuros(order.shippingCost)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #8a8a8a; font-size: 14px;">Frais de traitement</td>
        <td align="right" style="padding: 4px 0; color: #cccccc; font-size: 14px;">${formatEuros(order.processingFee)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0 0 0; color: #ffffff; font-size: 16px; font-weight: 700; border-top: 1px solid #3a3a3a;">Total</td>
        <td align="right" style="padding: 12px 0 0 0; color: #ffffff; font-size: 16px; font-weight: 700; border-top: 1px solid #3a3a3a;">${formatEuros(order.total)}</td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #101010; border: 1px solid #262626; border-left: 2px solid #ffce47; margin-bottom: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p style="color: #777777; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 8px 0;">Livraison</p>
          <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin: 0;">
            ${order.firstName} ${order.lastName}<br>
            ${order.addressLine1}${order.addressLine2 ? `<br>${order.addressLine2}` : ''}<br>
            ${order.postalCode} ${order.city}<br>
            ${order.country}
          </p>
        </td>
      </tr>
    </table>`;
}

// Construit la version texte brut du recapitulatif de commande (delivrabilite :
// une alternative text/plain credibilise l'email aupres des filtres anti-spam).
function renderOrderText(intro: string, order: OrderEmailData): string {
  const lines = order.items.map(
    (item) =>
      `- ${item.productName}${item.variantLabel ? ` (${item.variantLabel})` : ''} × ${item.quantity} : ${formatEuros(item.lineTotal)}`
  );
  return [
    'LA FORÊT PERFORMANCE',
    '',
    intro,
    '',
    'ARTICLES',
    ...lines,
    '',
    `Sous-total : ${formatEuros(order.subtotal)}`,
    `Frais de port : ${formatEuros(order.shippingCost)}`,
    `Frais de traitement : ${formatEuros(order.processingFee)}`,
    `TOTAL : ${formatEuros(order.total)}`,
    '',
    'LIVRAISON',
    `${order.firstName} ${order.lastName}`,
    order.addressLine1,
    ...(order.addressLine2 ? [order.addressLine2] : []),
    `${order.postalCode} ${order.city}`,
    order.country,
    '',
    '—',
    'La Forêt Performance — Pâturages et belles mécaniques en Charente-Maritime',
  ].join('\n');
}

// Enveloppe HTML commune des emails boutique, dans la DA du site : fond sombre,
// angles droits, lockup hairlines, ambre (#ffce47) en signal rare.
// Parametres: badge (etiquette), title (titre), intro (paragraphe d'intro),
// bodyHtml (contenu), preheader (texte d'apercu masque affiche par les clients mail).
function renderShopEmailShell(
  badge: string,
  title: string,
  intro: string,
  bodyHtml: string,
  preheader: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
      <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1a1a1a;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px;">
              <tr>
                <td align="center" style="padding-bottom: 20px;">
                  <img src="https://oh7qghmltywp4luq.public.blob.vercel-storage.com/lfp/logo-lfp.jpg" alt="LFP" width="56" height="56" style="border: 1px solid #333333; display: block;" />
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 28px;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="width: 32px; height: 1px; background-color: #555555; font-size: 0; line-height: 0;">&nbsp;</td>
                      <td style="padding: 0 12px; color: #ffffff; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 4px; white-space: nowrap;">La Forêt Performance</td>
                      <td style="width: 32px; height: 1px; background-color: #555555; font-size: 0; line-height: 0;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #141414; border: 1px solid #2a2a2a;">
                    <tr>
                      <td style="height: 2px; background-color: #ffce47; font-size: 0; line-height: 0;">&nbsp;</td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 36px;">
                        <p style="color: #ffce47; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 16px 0;">${badge}</p>
                        <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0; line-height: 1.35;">${title}</h1>
                        <p style="color: #9a9a9a; font-size: 14px; line-height: 1.7; margin: 0 0 28px 0;">${intro}</p>
                        ${bodyHtml}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top: 28px;">
                  <p style="color: #555555; font-size: 12px; letter-spacing: 1px; margin: 0 0 6px 0;">La Forêt Performance</p>
                  <p style="color: #444444; font-size: 11px; margin: 0;">Pâturages et belles mécaniques en Charente-Maritime</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;
}

// Envoie l'email de confirmation de commande au client.
// Parametre: order (commande payee avec ses articles).
// Sortie: { success, data? , error? }.
export async function sendOrderConfirmationEmail(order: OrderEmailData) {
  const transporter = createTransporter();
  if (!transporter) {
    return { success: true, data: { id: 'dev-mode' } };
  }

  try {
    const html = renderShopEmailShell(
      'Commande confirmée',
      `Merci ${order.firstName} !`,
      `Ta commande <strong style="color:#cccccc;">${order.orderNumber}</strong> est confirmée et payée. On te préviendra par email dès son expédition.`,
      `${renderOrderSummary(order)}${renderEmailButton(buildTrackingPageUrl(order), 'Suivre ma commande')}`,
      `Commande ${order.orderNumber} confirmée — total ${formatEuros(order.total)}.`
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: order.email,
      replyTo: process.env.SMTP_USER,
      subject: `Commande ${order.orderNumber} confirmée — La Forêt Performance`,
      html,
      text: renderOrderText(
        `Merci ${order.firstName} ! Ta commande ${order.orderNumber} est confirmée et payée. On te préviendra par email dès son expédition.\nSuivi : ${buildTrackingPageUrl(order)}`,
        order
      ),
    });
    return { success: true, data: { id: info.messageId } };
  } catch (error) {
    return { success: false, error };
  }
}

// Envoie au client l'email de passage en production de sa commande.
// Parametre: order (commande avec ses articles).
export async function sendOrderInProductionEmail(order: OrderEmailData) {
  const transporter = createTransporter();
  if (!transporter) {
    return { success: true, data: { id: 'dev-mode' } };
  }

  try {
    const html = renderShopEmailShell(
      'En production',
      'Ta commande part en production',
      `Bonne nouvelle ${order.firstName} : ta commande <strong style="color:#cccccc;">${order.orderNumber}</strong> est passée en production. On te préviendra dès qu'elle sera expédiée.`,
      renderEmailButton(buildTrackingPageUrl(order), 'Suivre ma commande'),
      `Commande ${order.orderNumber} en production.`
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: order.email,
      replyTo: process.env.SMTP_USER,
      subject: `Commande ${order.orderNumber} en production — La Forêt Performance`,
      html,
      text: `LA FORÊT PERFORMANCE\n\nBonne nouvelle ${order.firstName} : ta commande ${order.orderNumber} est passée en production. On te préviendra dès qu'elle sera expédiée.\n\nSuivi : ${buildTrackingPageUrl(order)}`,
    });
    return { success: true, data: { id: info.messageId } };
  } catch (error) {
    return { success: false, error };
  }
}

// Envoie au client l'email d'expedition avec le numero de suivi si disponible.
// Parametre: order (commande avec ses articles et trackingNumber eventuel).
export async function sendOrderShippedEmail(order: OrderEmailData) {
  const transporter = createTransporter();
  if (!transporter) {
    return { success: true, data: { id: 'dev-mode' } };
  }

  const trackingBlock = order.trackingNumber
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #101010; border: 1px solid #262626; border-left: 2px solid #ffce47; margin-bottom: 20px;">
        <tr>
          <td style="padding: 20px;">
            <p style="color: #777777; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 8px 0;">Numéro de suivi</p>
            <p style="color: #ffffff; font-size: 16px; letter-spacing: 1px; margin: 0 0 10px 0;">${order.trackingNumber}</p>
            <a href="${buildLaPosteUrl(order.trackingNumber)}" style="color: #ffce47; font-size: 13px; text-decoration: underline;">Suivre le colis sur laposte.fr</a>
          </td>
        </tr>
      </table>`
    : '';

  try {
    const html = renderShopEmailShell(
      'Expédiée',
      'Ta commande est en route',
      `Ça y est ${order.firstName}, ta commande <strong style="color:#cccccc;">${order.orderNumber}</strong> a été expédiée à l'adresse indiquée lors de ta commande.`,
      `${trackingBlock}${renderEmailButton(buildTrackingPageUrl(order), 'Suivre ma commande')}`,
      `Commande ${order.orderNumber} expédiée${order.trackingNumber ? ` — suivi ${order.trackingNumber}` : ''}.`
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: order.email,
      replyTo: process.env.SMTP_USER,
      subject: `Commande ${order.orderNumber} expédiée — La Forêt Performance`,
      html,
      text: `LA FORÊT PERFORMANCE\n\nÇa y est ${order.firstName}, ta commande ${order.orderNumber} a été expédiée.${order.trackingNumber ? `\n\nNuméro de suivi : ${order.trackingNumber}\nSuivi La Poste : ${buildLaPosteUrl(order.trackingNumber)}` : ''}\n\nSuivi : ${buildTrackingPageUrl(order)}`,
    });
    return { success: true, data: { id: info.messageId } };
  } catch (error) {
    return { success: false, error };
  }
}

// Envoie au client la confirmation d'annulation (et de remboursement le cas echeant).
// Parametres: order (commande), refunded (true si un remboursement Stripe a ete emis).
export async function sendOrderCancelledEmail(order: OrderEmailData, refunded: boolean) {
  const transporter = createTransporter();
  if (!transporter) {
    return { success: true, data: { id: 'dev-mode' } };
  }

  const refundSentence = refunded
    ? ` Le remboursement de <strong style="color:#cccccc;">${formatEuros(order.total)}</strong> a été émis — il apparaîtra sur ton compte sous 5 à 10 jours ouvrés.`
    : '';

  try {
    const html = renderShopEmailShell(
      'Annulée',
      'Ta commande est annulée',
      `${order.firstName}, ta commande <strong style="color:#cccccc;">${order.orderNumber}</strong> a bien été annulée.${refundSentence}`,
      '',
      `Commande ${order.orderNumber} annulée${refunded ? ` — remboursement de ${formatEuros(order.total)} émis` : ''}.`
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: order.email,
      replyTo: process.env.SMTP_USER,
      subject: `Commande ${order.orderNumber} annulée — La Forêt Performance`,
      html,
      text: `LA FORÊT PERFORMANCE\n\n${order.firstName}, ta commande ${order.orderNumber} a bien été annulée.${refunded ? ` Le remboursement de ${formatEuros(order.total)} a été émis — il apparaîtra sur ton compte sous 5 à 10 jours ouvrés.` : ''}`,
    });
    return { success: true, data: { id: info.messageId } };
  } catch (error) {
    return { success: false, error };
  }
}

// Envoie au client la confirmation de remboursement d'une commande.
// Parametre: order (commande remboursee).
export async function sendOrderRefundedEmail(order: OrderEmailData) {
  const transporter = createTransporter();
  if (!transporter) {
    return { success: true, data: { id: 'dev-mode' } };
  }

  try {
    const html = renderShopEmailShell(
      'Remboursée',
      'Ta commande est remboursée',
      `${order.firstName}, ta commande <strong style="color:#cccccc;">${order.orderNumber}</strong> a été remboursée à hauteur de <strong style="color:#cccccc;">${formatEuros(order.total)}</strong>. Le montant apparaîtra sur ton compte sous 5 à 10 jours ouvrés.`,
      '',
      `Commande ${order.orderNumber} remboursée — ${formatEuros(order.total)}.`
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: order.email,
      replyTo: process.env.SMTP_USER,
      subject: `Commande ${order.orderNumber} remboursée — La Forêt Performance`,
      html,
      text: `LA FORÊT PERFORMANCE\n\n${order.firstName}, ta commande ${order.orderNumber} a été remboursée à hauteur de ${formatEuros(order.total)}. Le montant apparaîtra sur ton compte sous 5 à 10 jours ouvrés.`,
    });
    return { success: true, data: { id: info.messageId } };
  } catch (error) {
    return { success: false, error };
  }
}

// Notifie l'administration qu'un client demande l'annulation de sa commande.
// Parametre: order (commande concernee avec ses articles).
export async function sendCancelRequestAdminNotification(order: OrderEmailData) {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER;
  if (!transporter || !adminEmail) {
    return { success: true, data: { id: 'dev-mode' } };
  }

  try {
    const html = renderShopEmailShell(
      'Demande d\'annulation',
      `Commande ${order.orderNumber}`,
      `<strong style="color:#cccccc;">${order.firstName} ${order.lastName}</strong> (${order.email}) demande l'annulation de sa commande. Rendez-vous dans l'admin pour annuler et rembourser en un clic.`,
      renderOrderSummary(order),
      `Demande d'annulation sur la commande ${order.orderNumber}.`
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `Demande d'annulation — commande ${order.orderNumber}`,
      html,
      text: renderOrderText(
        `${order.firstName} ${order.lastName} (${order.email}) demande l'annulation de la commande ${order.orderNumber}.`,
        order
      ),
    });
    return { success: true, data: { id: info.messageId } };
  } catch (error) {
    return { success: false, error };
  }
}

// Notifie l'administration d'une nouvelle commande payee.
// Parametre: order (commande payee avec ses articles).
// Sortie: { success, data? , error? }.
export async function sendNewOrderAdminNotification(order: OrderEmailData) {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER;
  if (!transporter || !adminEmail) {
    return { success: true, data: { id: 'dev-mode' } };
  }

  try {
    const html = renderShopEmailShell(
      'Nouvelle commande',
      `Commande ${order.orderNumber}`,
      `Nouvelle commande payée de <strong style="color:#cccccc;">${order.firstName} ${order.lastName}</strong> (${order.email}).`,
      renderOrderSummary(order),
      `Nouvelle commande ${order.orderNumber} de ${order.firstName} ${order.lastName} — ${formatEuros(order.total)}.`
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `Nouvelle commande ${order.orderNumber} (${formatEuros(order.total)})`,
      html,
      text: renderOrderText(
        `Nouvelle commande payée de ${order.firstName} ${order.lastName} (${order.email}).`,
        order
      ),
    });
    return { success: true, data: { id: info.messageId } };
  } catch (error) {
    return { success: false, error };
  }
}
