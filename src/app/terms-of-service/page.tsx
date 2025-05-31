
'use client';

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export default function TermsOfServicePage() {
  const contactEmail = 'lxmwaniky@gmail.com';
  const lastUpdatedDate = 'October 28, 2023'; // Update this manually when you make changes

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 container py-8 sm:py-12 md:py-10">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Terms of Service for LukuCheck</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] p-1 sm:p-3 border rounded-md">
              <div className="space-y-6 text-sm text-foreground/90">
                <p className="text-xs text-muted-foreground">Last updated: {lastUpdatedDate}</p>

                <p>
                  Welcome to LukuCheck! We're excited to have you join our community of style enthusiasts.
                  LukuCheck ("App", "Service", "we", "us", "our") is designed to be a fun and engaging platform
                  where you can get AI-powered feedback on your outfits, earn points and badges, and participate
                  in a daily style leaderboard.
                </p>
                <p>
                  These Terms of Service ("Terms") outline the rules for using our App. By creating an account,
                  accessing, or using LukuCheck, you agree to be bound by these Terms and our{' '}
                  <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
                  If you don't agree with these Terms, please don't use LukuCheck.
                </p>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">1. Who Can Use LukuCheck?</h2>
                  <p>
                    You must be at least 13 years old to create an account and use LukuCheck. If you are under 18,
                    you confirm that you have your parent or guardian's permission to use the App and that they have
                    read and agreed to these Terms on your behalf.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">2. Your LukuCheck Account</h2>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>
                      <strong>Account Creation:</strong> You'll need to provide a valid email address, choose a username, and create a password. Please ensure your information is accurate.
                    </li>
                    <li>
                      <strong>Username:</strong> Your username will be publicly visible on leaderboards and your profile. Choose wisely and respectfully.
                    </li>
                    <li>
                      <strong>Account Security:</strong> You are responsible for keeping your password safe and for all activities that occur under your account. If you suspect unauthorized use of your account, please notify us immediately at{' '}
                      <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">3. Using LukuCheck: Your Content and Conduct</h2>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>
                      <strong>Your Content:</strong> You own the rights to the outfit photos and profile pictures you upload ("Your Content").
                    </li>
                    <li>
                      <strong>License to Us:</strong> By uploading Your Content, you grant LukuCheck a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute Your Content in connection with operating and promoting the Service (e.g., displaying your outfit on the leaderboard, in your profile). This license ends when you delete Your Content or your account, except for content that has been shared with others and they have not deleted it, or for our internal operational backups.
                    </li>
                    <li>
                      <strong>Content Standards for Fair Play:</strong>
                        <ul className="list-circle list-inside pl-4 space-y-0.5 mt-1">
                            <li>Outfit photos should be of you (or a person you have permission from) wearing an actual outfit.</li>
                            <li>Avoid uploading photos of celebrities, models from magazines/websites, illustrations, or outfits on mannequins as these are not eligible for fair leaderboard competition. Our AI attempts to identify such submissions.</li>
                        </ul>
                    </li>
                    <li>
                      <strong>Prohibited Content:</strong> You agree not to upload or share content that:
                        <ul className="list-circle list-inside pl-4 space-y-0.5 mt-1">
                            <li>Is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy.</li>
                            <li>Contains nudity or sexually explicit material.</li>
                            <li>Promotes hate speech, discrimination, or violence against individuals or groups based on race, ethnic origin, religion, gender, sexual orientation, disability, or age.</li>
                            <li>Infringes on any third party's intellectual property rights (e.g., copyright, trademark).</li>
                            <li>Contains viruses or any other computer code, files, or programs designed to interrupt, destroy, or limit the functionality of any computer software or hardware.</li>
                        </ul>
                    </li>
                    <li>
                      <strong>Respectful Conduct:</strong> Interact with the LukuCheck community and any interactive features respectfully. Do not harass, bully, or intimidate other users.
                    </li>
                    <li>
                      <strong>No Misuse:</strong> Do not attempt to interfere with the proper working of LukuCheck, bypass our security measures, or use the App for any fraudulent or misleading purpose.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">4. AI Feedback and Leaderboards</h2>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>
                      <strong>AI For Fun & Guidance:</strong> The AI ratings, critiques, and suggestions are provided for entertainment and general style guidance. While we strive for helpful feedback, it's subjective and based on algorithms. Don't take it as absolute fashion law!
                    </li>
                    <li>
                      <strong>Leaderboard:</strong> The daily leaderboard showcases outfits submitted by users, ranked by AI score. It's meant for friendly competition and style inspiration.
                    </li>
                    <li>
                      <strong>AI Usage Limits:</strong> There's a daily limit on how many times you can use the AI for rating to ensure fair access for all users. This limit resets daily.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">5. LukuPoints and Badges</h2>
                   <p>LukuPoints and Badges are virtual rewards you earn within the App for various activities like submitting outfits, achieving streaks, or referring friends. These have no real-world monetary value and cannot be sold, transferred, or exchanged for cash.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">6. Our Rights (Community Moderation)</h2>
                   <p>
                     While LukuCheck is primarily for fun, we want to maintain a safe and positive environment. We reserve the right, but do not have the obligation, to:
                   </p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Review and remove any content that we believe, in our sole discretion, violates these Terms or our community spirit, without prior notice.</li>
                    <li>Suspend or terminate accounts of users who repeatedly or egregiously violate these Terms.</li>
                    <li>Modify or discontinue the Service, or any part of it, at any time with or without notice.</li>
                  </ul>
                  <p>We aim to be fair, but decisions regarding content and account status are ultimately ours.</p>
                </section>
                
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">7. Disclaimers</h2>
                   <p>
                     LukuCheck is provided "AS IS" and "AS AVAILABLE" without any warranties, express or implied. We don't guarantee that the App will always be safe, secure, error-free, or that it will function without disruptions, delays, or imperfections.
                   </p>
                   <p>
                     We are not responsible for the conduct, whether online or offline, of any user of LukuCheck.
                   </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">8. Limitation of Liability</h2>
                   <p>
                     To the fullest extent permitted by applicable law, LukuCheck (and its creator) will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your access to or use of or inability to access or use the service; (b) any conduct or content of any third party on the service; or (c) unauthorized access, use, or alteration of your transmissions or content.
                   </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">9. Governing Law</h2>
                   <p>
                     These Terms shall be governed by the laws of Kenya, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or your use of LukuCheck will be subject to the exclusive jurisdiction of the courts in Kenya.
                   </p>
                </section>
                
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">10. Changes to These Terms</h2>
                   <p>
                     We may update these Terms from time to time. If we make changes, we will post the revised Terms on this page and update the "Last updated" date. Your continued use of LukuCheck after any changes signifies your acceptance of the new Terms. We encourage you to review these Terms periodically.
                   </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">11. Contact Us</h2>
                  <p>
                    If you have any questions, concerns, or feedback about these Terms or LukuCheck, please get in touch at{' '}
                    <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>.
                  </p>
                </section>

                <p className="pt-4">Thank you for being part of the LukuCheck community!</p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
