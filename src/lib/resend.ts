import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendVerificationEmailParams {
  to: string;
  name: string;
  code: string;
}

export async function sendVerificationEmail({ to, name, code }: SendVerificationEmailParams) {
  const { data, error } = await resend.emails.send({
    from: 'Prakto <noreply@prakto.se>',
    to,
    subject: `${code} — Din verifieringskod för Prakto`,
    html: `
      <!DOCTYPE html>
      <html lang="sv">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding:32px 32px 0;text-align:center;">
                    <h1 style="margin:0;font-size:24px;font-weight:700;color:#18181b;">Prakto</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding:24px 32px 32px;">
                    <p style="margin:0 0 16px;font-size:16px;color:#18181b;">
                      Hej ${name},
                    </p>
                    <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
                      Använd koden nedan för att verifiera din e-postadress:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 24px;">
                          <div style="display:inline-block;padding:16px 40px;background-color:#f4f4f5;border-radius:12px;border:2px dashed #d4d4d8;">
                            <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#18181b;font-family:monospace;">
                              ${code}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0;font-size:13px;color:#a1a1aa;text-align:center;">
                      Koden är giltig i 15 minuter. Om du inte skapade detta konto kan du ignorera detta mejl.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#a1a1aa;">
                      &copy; ${new Date().getFullYear()} Prakto Sverige AB
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  });

  if (error) {
    throw new Error(`Kunde inte skicka verifieringsmejl: ${error.message}`);
  }

  return data;
}
