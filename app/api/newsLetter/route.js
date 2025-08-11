import connectDB from '@/lib/connectDB';
import NewsLetter from '@/models/NewsLetter';

export async function GET() {
  await connectDB();
  try {
    const all = await NewsLetter.find({}, { email: 1, _id: 0 });
    return new Response(JSON.stringify({ success: true, emails: all.map(e => e.email) }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Server error.' }), { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const { email } = await req.json();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid email.' }), { status: 400 });
    }
    // Prevent duplicate
    const exists = await NewsLetter.findOne({ email });
    if (exists) {
      return new Response(JSON.stringify({ success: false, message: 'Email already subscribed.' }), { status: 409 });
    }
    await NewsLetter.create({ email });

    // Send welcome email via Brevo
    try {
      const apiKey = process.env.BREVO_API_KEY;
      if (apiKey) {
        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Adventure Axis', email: 'info@adventureaxis.in' },
            to: [{ email }],
            subject: 'Thank You for Subscribing – Get Ready for Exclusive Deals!',
            htmlContent: `
            <div style="font-family: 'Courier New', Courier, monospace; background: #fcf7f1; margin:0; padding:0;">
              <!-- Header -->
              <div style="background:#c7eaff;padding:24px 0 12px 0;text-align:center;border-bottom:2px solid #222;">
                <h1 style="margin:0;font-size:2.2rem;font-weight:900;letter-spacing:1px;">
                  <span style="border-bottom:4px solid #222;">Adventure Axis</span>
                </h1>
                <div style="font-size:1.1rem;font-weight:500;margin-top:6px;">
                  Adventure Axis is an complete outdoor shop.
                </div>
              </div>
              <!-- Main Content -->
              <div style="max-width:600px;margin:32px auto 0 auto;background:#fff;padding:32px 24px 24px 24px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                <p style="font-size:1.1rem;font-weight:bold;">Dear Valuable User,</p>
                <p style="font-size:1.05rem;">Thank you for subscribing to us!</p>
                <p style="font-size:1.05rem;">
                  We&rsquo;re excited to have you as part of our Adventure Axis family. You&rsquo;ll now be the first to know about our best trending deals, exclusive offers, and new arrivals delivered straight to your inbox from time to time.
                </p>
                <p style="font-size:1.05rem;">
                 Adventure Axis is an complete outdoor shop.Adventure Sports Equipment Store 👉 Water Sports Equipment 👉 Safety & Rescue Equipment 👉 Clothing & Footwear 👉 Camping & Outdoor 👉 Expedition GearRaft-Inflatables
                </p>
                <p style="font-size:1.05rem;margin-top:28px;margin-bottom:0;">
                  Happy Shopping!<br>
                  <strong>Team Adventure Axis</strong>
                </p>
                <div style="margin:28px 0 18px 0;">
                  <img src="https://www.info@adventureaxis.in/_next/image?url=%2Flogo.png&w=256&q=75" alt="Adventure Axis Logo" style="height:64px;margin-bottom:8px;" />
                  <div style="font-size:1.1rem;font-weight:bold;margin-bottom:2px;">
                    Web: <a href="https://www.info@adventureaxis.in" style="color:#0056b3;text-decoration:underline;">www.info@adventureaxis.in</a>
                  </div>
                  <div style="font-size:0.98rem;color:#444;">Your Gateway to Artisan Excellence</div>
                </div>
              </div>
              <!-- Footer -->
              <div style="background:#ededed;padding:20px 0 16px 0;margin-top:32px;font-size:0.93rem;color:#222;border-top:2px solid #222;">
                <div style="max-width:700px;margin:0 auto;padding:0 16px;">
                  Please do not reply to this mail as this is an automated mail service. The information provided on this website is for general informational purposes only. While we strive to keep the information up to date and accurate, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability with respect to the website or the information, products, services, or related graphics contained on the website for any purpose.
                  <br><br>
                  If you would prefer not receiving our emails, please click here to <a href="https://www.info@adventureaxis.in/unsubscribe" style="color:#0056b3;">unsubscribe</a>.<br>
                  <span style="color:#888;">© {`(new Date().getFullYear())`} Adventure Axis. All rights reserved</span>
                </div>
              </div>
            </div>
          `
          })
        });
      } else {
        console.warn('BREVO_API_KEY not set. Email not sent.');
      }
    } catch (err) {
      // Don't fail subscription if email fails
      console.error('Failed to send welcome email:', err);
    }

    return new Response(JSON.stringify({ success: true, message: 'Subscribed successfully.' }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Server error.' }), { status: 500 });
  }
}
