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
  total: number;
  items: OrderEmailItem[];
}

// Construit les lignes HTML du recapitulatif d'articles d'une commande.
function renderOrderItemsRows(items: OrderEmailItem[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #1f1f1f; color: #cccccc; font-size: 14px;">
            ${item.productName}${item.variantLabel ? ` <span style="color:#666666;">(${item.variantLabel})</span>` : ''}
            <span style="color:#666666;"> × ${item.quantity}</span>
          </td>
          <td align="right" style="padding: 12px 0; border-bottom: 1px solid #1f1f1f; color: #ffffff; font-size: 14px; white-space: nowrap;">
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
        <td style="padding: 14px 0 4px 0; color: #888888; font-size: 14px;">Sous-total</td>
        <td align="right" style="padding: 14px 0 4px 0; color: #cccccc; font-size: 14px;">${formatEuros(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #888888; font-size: 14px;">Frais de port</td>
        <td align="right" style="padding: 4px 0; color: #cccccc; font-size: 14px;">${formatEuros(order.shippingCost)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0 0 0; color: #ffffff; font-size: 16px; font-weight: 700; border-top: 1px solid #333333;">Total</td>
        <td align="right" style="padding: 12px 0 0 0; color: #ffffff; font-size: 16px; font-weight: 700; border-top: 1px solid #333333;">${formatEuros(order.total)}</td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #111111; border-radius: 12px; margin-bottom: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p style="color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Livraison</p>
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

// Enveloppe HTML commune des emails boutique (reprend le style sombre LFP).
// Parametres: badge (etiquette), title (titre), intro (paragraphe d'intro), bodyHtml (contenu).
function renderShopEmailShell(badge: string, title: string, intro: string, bodyHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
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
                      <td style="height: 2px; background: linear-gradient(90deg, #333333 0%, #ff4d00 50%, #333333 100%);"></td>
                    </tr>
                    <tr>
                      <td style="padding: 48px 40px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                          <tr>
                            <td style="background-color: rgba(255, 77, 0, 0.08); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255, 77, 0, 0.25);">
                              <span style="color: #ff7a3d; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${badge}</span>
                            </td>
                          </tr>
                        </table>
                        <h1 style="color: #ffffff; font-size: 26px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.3;">${title}</h1>
                        <p style="color: #666666; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">${intro}</p>
                        ${bodyHtml}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top: 32px;">
                  <p style="color: #333333; font-size: 12px; margin: 0 0 8px 0;">La Forêt Performance</p>
                  <p style="color: #222222; font-size: 11px; margin: 0;">Pâturages et belles mécaniques en Charente-Maritime</p>
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
      `Votre commande <strong style="color:#888888;">${order.orderNumber}</strong> est confirmée et payée. Vous recevrez un email lors de son expédition.`,
      renderOrderSummary(order)
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: order.email,
      subject: `Confirmation de commande ${order.orderNumber} - La Forêt Performance`,
      html,
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
      `Nouvelle commande payée de <strong style="color:#888888;">${order.firstName} ${order.lastName}</strong> (${order.email}).`,
      renderOrderSummary(order)
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `Nouvelle commande ${order.orderNumber} (${formatEuros(order.total)})`,
      html,
    });
    return { success: true, data: { id: info.messageId } };
  } catch (error) {
    return { success: false, error };
  }
}
