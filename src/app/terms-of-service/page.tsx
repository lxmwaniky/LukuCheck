
'use client';

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export default function TermsOfServicePage() {
  const contactEmail = 'lxmwaniky@gmail.com';
  const appName = 'LukuCheck';
  // Remember to update this date if you make significant changes to the terms!
  const lastUpdatedDate = 'May 31, 2025'; 

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 container py-8 sm:py-12 md:py-10">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Terms of Service for {appName}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] p-1 sm:p-3 border rounded-md">
              <div className="space-y-6 text-sm text-foreground/90">
                <p className="text-xs text-muted-foreground">Last updated: {lastUpdatedDate}</p>

                <p>
                  Welcome to {appName}! We're excited to have you join our community of style enthusiasts.
                  {appName} ("App", "Service", "we", "us", "our") is designed to be a fun and engaging platform
                  where you can get AI-powered feedback on your outfits, earn points and badges, and participate
                  in a daily style leaderboard. These Terms of Service ("Terms") outline the rules for using our App.
                </p>
                <p>
                  By creating an account, accessing, or using {appName}, you agree to be bound by these Terms and our{' '}
                  <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
                  If you do not agree with these Terms, please do not use {appName}.
                </p>
                <p>
                  {appName} is intended for personal, non-commercial entertainment and informational purposes. While we strive to foster a safe and positive environment, we are not a business entity in the traditional sense and this service is provided on an "as-is" basis by an individual developer.
                </p>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">1. Who Can Use {appName}?</h2>
                  <p>
                    You must be at least 13 years old to create an account and use {appName}. If you are under 18 (or the age of majority in your jurisdiction),
                    you confirm that you have your parent or legal guardian's permission to use the App and that they have
                    read and agreed to these Terms on your behalf.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">2. Your {appName} Account</h2>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>
                      <strong>Account Creation:</strong> You'll need to provide a valid email address, choose a username, and create a password. Please ensure your information is accurate. Your email is used for account verification and essential communications.
                    </li>
                    <li>
                      <strong>Username:</strong> Your username will be publicly visible on leaderboards and potentially other public-facing parts of your profile. Choose a username that is respectful and not offensive or misleading.
                    </li>
                    <li>
                      <strong>Account Security:</strong> You are responsible for keeping your password safe and for all activities that occur under your account. If you suspect unauthorized use of your account, please notify us immediately at{' '}
                      <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>. We are not liable for any loss or damage arising from your failure to protect your password or account.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">3. Using {appName}: Your Content and Conduct</h2>
                  <ul className="list-disc list-inside pl-4 space-y-2">
                    <li>
                      <strong>Your Content:</strong> You are solely responsible for the photos, profile pictures, and any other information or material you upload, submit, or display on or through the Service ("Your Content"). You retain all ownership rights to Your Content.
                    </li>
                    <li>
                      <strong>License to Us:</strong> By submitting Your Content to {appName}, you grant us a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, host, store, reproduce, modify, create derivative works (such as those resulting from translations, adaptations, or other changes we make so that Your Content works better with the Service), communicate, publish, publicly perform, publicly display, and distribute Your Content. This license is for the limited purpose of operating, promoting, and improving the Service, and developing new ones. This license continues even if you stop using our Service with respect to aggregated and anonymized data derived from Your Content and any residual backup copies of Your Content made in the ordinary course of our business.
                    </li>
                    <li>
                      <strong>Content Standards and Prohibited Content:</strong> You agree not to upload or share content that:
                        <ul className="list-circle list-inside pl-4 space-y-1 mt-1">
                            <li>
                              <strong>Violates Privacy or Lacks Consent:</strong> You MUST NOT upload photos or images of any identifiable individual other than yourself unless you have obtained that individual's explicit, verifiable consent to use their image in {appName}, including for AI analysis and public display on leaderboards. Uploading photos of others (friends, family, strangers, etc.) without their clear consent is a serious violation of these Terms and basic respect for privacy. Our AI attempts to identify such submissions, but the ultimate responsibility lies with you.
                            </li>
                            <li>Is illegal, harmful, threatening, abusive, harassing, defamatory, libelous, vulgar, obscene, pornographic, or invasive of another's privacy or publicity rights.</li>
                            <li>Contains nudity or sexually explicit material not appropriate for a general audience.</li>
                            <li>Promotes hate speech, discrimination, or violence against individuals or groups based on race, ethnic origin, religion, gender, sexual orientation, disability, age, or any other protected characteristic.</li>
                            <li>Infringes on any third party's intellectual property rights (e.g., copyright, trademark, patent, trade secret). Do not upload images you do not own or have permission to use.</li>
                            <li>Contains viruses, malware, or any other computer code, files, or programs designed to interrupt, destroy, or limit the functionality of any computer software or hardware.</li>
                            <li>Is fraudulent, false, misleading, or deceptive (e.g., impersonating someone else, using stock photos or celebrity images for leaderboard competition is not permitted).</li>
                            <li>Exploits or endangers minors.</li>
                        </ul>
                    </li>
                    <li>
                      <strong>Respectful Conduct:</strong> Interact with the {appName} community (if applicable) and any interactive features respectfully. Do not harass, bully, stalk, or intimidate other users.
                    </li>
                    <li>
                      <strong>No Misuse:</strong> Do not attempt to interfere with the proper working of {appName}, bypass our security measures, use automated systems (bots, scrapers) to access the Service without permission, or use the App for any commercial purpose not expressly permitted by us.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">4. AI Feedback and Leaderboards</h2>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>
                      <strong>AI For Fun & Guidance:</strong> The AI ratings, critiques, and suggestions are provided for entertainment and general style guidance. While we strive for helpful feedback, it's subjective and based on algorithms. It should not be taken as absolute fashion law or professional styling advice.
                    </li>
                    <li>
                      <strong>Leaderboard:</strong> The daily leaderboard showcases outfits submitted by users, ranked by AI score. It's meant for friendly competition and style inspiration. Submission to the leaderboard is optional.
                    </li>
                    <li>
                      <strong>AI Usage Limits:</strong> There's a daily limit on how many times you can use the AI for rating to ensure fair access for all users. This limit resets daily as specified in the App.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">5. LukuPoints and Badges</h2>
                   <p>LukuPoints and Badges are virtual rewards you earn within the App for various activities. These are for entertainment purposes only, have no real-world monetary value, and cannot be sold, transferred, or exchanged for cash or any other goods or services outside of the App.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">6. Our Rights (Community Moderation & Service Operation)</h2>
                   <p>
                     We want {appName} to be a fun and safe space. To achieve this, we reserve the right, but do not have the obligation, to:
                   </p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>Monitor, review, screen, or remove any content (including Your Content) that we believe, in our sole discretion, violates these Terms, our community spirit, or is otherwise objectionable, without prior notice.</li>
                    <li>Suspend, disable, or terminate your account or access to the Service, with or without notice, for any reason, including but not limited to, violation of these Terms or if your conduct is harmful to other users or the Service.</li>
                    <li>Modify, suspend, or discontinue the Service, or any part of it (including features, LukuPoints/Badge systems, etc.), at any time with or without notice. We are not liable to you or any third party for any modification, suspension, or discontinuance of the Service.</li>
                  </ul>
                  <p>Decisions regarding content and account status are ultimately ours, and we aim to apply these rights fairly, though interpretations may be subjective.</p>
                </section>
                
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">7. Disclaimers</h2>
                   <p>
                     THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTIES ARISING OUT OF COURSE OF DEALING OR USAGE OF TRADE. WE DO NOT GUARANTEE THAT THE APP WILL ALWAYS BE SAFE, SECURE, ERROR-FREE, OR THAT IT WILL FUNCTION WITHOUT DISRUPTIONS, DELAYS, OR IMPERFECTIONS. THE AI FEEDBACK IS FOR ENTERTAINMENT AND IS NOT A SUBSTITUTE FOR PROFESSIONAL ADVICE.
                   </p>
                   <p>
                     WE ARE NOT RESPONSIBLE FOR THE CONDUCT, WHETHER ONLINE OR OFFLINE, OF ANY USER OF {appName}. YOU USE THE SERVICE AT YOUR OWN RISK.
                   </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">8. Limitation of Liability</h2>
                   <p>
                     TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, {appName} (AND ITS INDIVIDUAL CREATOR) WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE (INCLUDING OTHER USERS OR AI-GENERATED CONTENT); OR (C) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR CONTENT OR ACCOUNT, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN NO EVENT SHALL OUR AGGREGATE LIABILITY EXCEED THE GREATER OF ONE HUNDRED U.S. DOLLARS (USD $100.00) OR THE AMOUNT YOU PAID US, IF ANY, IN THE PAST SIX MONTHS FOR THE SERVICES GIVING RISE TO THE CLAIM. THE LIMITATIONS OF THIS SUBSECTION SHALL APPLY TO ANY THEORY OF LIABILITY, WHETHER BASED ON WARRANTY, CONTRACT, STATUTE, TORT (INCLUDING NEGLIGENCE), OR OTHERWISE, AND WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF ANY SUCH DAMAGE, AND EVEN IF A REMEDY SET FORTH HEREIN IS FOUND TO HAVE FAILED OF ITS ESSENTIAL PURPOSE.
                   </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">9. Indemnification</h2>
                  <p>
                    You agree to indemnify, defend, and hold harmless {appName} and its creator from and against any and all claims, liabilities, damages, losses, costs, expenses, and fees (including reasonable attorneys' fees) that such parties may incur as a result of or arising from your (or anyone using your account's) violation of these Terms or your use of the Service.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">10. Governing Law and Dispute Resolution</h2>
                   <p>
                     These Terms shall be governed by and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or your use of {appName} will be resolved through amicable negotiation. If negotiation fails, such disputes shall be subject to the exclusive jurisdiction of the competent courts in Kenya.
                   </p>
                </section>
                
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">11. Changes to These Terms</h2>
                   <p>
                     We may update these Terms from time to time to reflect changes to our Service or for other operational, legal, or regulatory reasons. If we make material changes, we will endeavor to provide notice through the App or by other means before the changes take effect. Your continued use of {appName} after any changes signifies your acceptance of the new Terms. We encourage you to review these Terms periodically. The "Last updated" date at the top indicates when these Terms were last revised.
                   </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">12. Termination</h2>
                  <p>
                    You can stop using the Service at any time. We may also terminate or suspend your access to the Service at any time, in our sole discretion, without notice, for conduct that we believe violates these Terms or is otherwise harmful to other users of the Service, us, or third parties, or for any other reason. Provisions of these Terms that by their nature should survive termination will survive, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">13. Severability and Waiver</h2>
                   <p>
                     If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect and enforceable. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                   </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">14. Contact Us</h2>
                  <p>
                    If you have any questions, concerns, or feedback about these Terms or {appName}, please get in touch at{' '}
                    <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>.
                  </p>
                </section>

                <p className="pt-4">Thank you for being part of the {appName} community! Enjoy styling!</p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
