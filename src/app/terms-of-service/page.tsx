
'use client';

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TermsOfServicePage() {
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
              <div className="space-y-4 text-sm text-muted-foreground">
                <p className="font-bold text-destructive">
                  IMPORTANT: This is a placeholder Terms of Service. You MUST replace this with a legally sound document tailored to your application and jurisdiction. Consult a legal professional.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">1. Introduction</h2>
                <p>
                  Welcome to LukuCheck ("App", "Service", "we", "us", "our"). These Terms of Service ("Terms") govern your use of our mobile application and website (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">2. Use of Our Service</h2>
                <p>
                  LukuCheck provides a platform for users to upload images of their outfits, receive AI-generated ratings and feedback, and participate in a daily leaderboard challenge.
                </p>
                <p>
                  You agree not to misuse the Service or help anyone else to do so. You are responsible for your conduct and your content.
                </p>
                <p>
                  You must be at least 13 years old to use the Service, or such higher age as may be required in your country.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">3. User Accounts</h2>
                <p>
                  To use certain features of our Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
                </p>
                <p>
                  You are responsible for safeguarding your password and for any activities or actions under your password.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">4. User Content</h2>
                <p>
                  You retain ownership of any intellectual property rights that you hold in the content you upload to the Service. When you upload content to our Service, you give us a worldwide license to use, host, store, reproduce, modify, create derivative works, communicate, publish, publicly perform, publicly display, and distribute such content. This license is for the limited purpose of operating, promoting, and improving our Services, and to develop new ones.
                </p>
                <p>
                  You agree not to upload content that is illegal, offensive, or infringes on the rights of others. We reserve the right to remove content that violates these Terms.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">5. AI-Generated Content</h2>
                <p>
                  The ratings, suggestions, and critiques provided by the AI are for entertainment and informational purposes only. We do not guarantee the accuracy or applicability of AI-generated content.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">6. Prohibited Conduct</h2>
                <p>
                  You agree not to engage in any of the following prohibited activities: (i) copying, distributing, or disclosing any part of the Service in any medium; (ii) using any automated system, including without limitation "robots," "spiders," "offline readers," etc., to access the Service; (iii) transmitting spam, chain letters, or other unsolicited email; (iv) attempting to interfere with, compromise the system integrity or security or decipher any transmissions to or from the servers running the Service.
                </p>
                
                <h2 className="text-lg font-semibold text-foreground pt-2">7. LukuPoints and Badges</h2>
                <p>
                  LukuPoints and Badges are virtual items awarded within the App. They have no real-world monetary value and cannot be exchanged for cash or other goods outside of the Service. We reserve the right to modify or discontinue the LukuPoints and Badges system at any time.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">8. Termination</h2>
                <p>
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">9. Disclaimer of Warranties</h2>
                <p>
                  The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Your use of the Service is at your sole risk. The Service is provided without warranties of any kind, whether express or implied.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">10. Limitation of Liability</h2>
                <p>
                  In no event shall LukuCheck, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">11. Governing Law</h2>
                <p>
                  These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction/Country, e.g., "the State of California, United States"], without regard to its conflict of law provisions.
                </p>
                <p className="font-bold text-destructive">
                  Reminder: Specify your jurisdiction.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">12. Changes to Terms</h2>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">13. Contact Us</h2>
                <p>
                  If you have any questions about these Terms, please contact us at [Your Contact Email Address].
                </p>
                <p className="font-bold text-destructive">
                  Reminder: Add your contact email.
                </p>

                <p className="pt-4">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
