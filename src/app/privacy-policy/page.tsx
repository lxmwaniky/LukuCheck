
'use client';

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 container py-8 sm:py-12 md:py-10">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Privacy Policy for LukuCheck</CardTitle>
          </CardHeader>
          <CardContent>
             <ScrollArea className="h-[60vh] p-1 sm:p-3 border rounded-md">
              <div className="space-y-4 text-sm text-muted-foreground">
                <p className="font-bold text-destructive">
                  IMPORTANT: This is a placeholder Privacy Policy. You MUST replace this with a legally sound document tailored to your application, data practices, and jurisdiction. Consult a legal professional. This template may not cover GDPR, CCPA, or other specific legal requirements.
                </p>

                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-lg font-semibold text-foreground pt-2">1. Introduction</h2>
                <p>
                  LukuCheck ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Service").
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">2. Information We Collect</h2>
                <p>
                  We may collect information about you in a variety of ways. The information we may collect via the Service includes:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>
                    <strong>Personal Data:</strong> Personally identifiable information, such as your email address, username, and any social media URLs you voluntarily provide when you register an account or update your profile.
                  </li>
                  <li>
                    <strong>User Content:</strong> Images of outfits you upload for AI analysis and/or submission to the leaderboard, and any associated AI-generated feedback. Profile pictures you upload.
                  </li>
                  <li>
                    <strong>Usage Data:</strong> Information automatically collected when you access and use the Service, such as your IP address (which may be used to approximate location), device type, operating system, browser type, access times, and the pages you have viewed directly before and after accessing the Service. This also includes your LukuPoints, badges, streaks, and AI usage counts.
                  </li>
                  <li>
                    <strong>Information from Third-Party Services:</strong> If you register or log in using a third-party service (e.g., Google), we may receive information from that service, such as your name, email, and profile picture, as permitted by your privacy settings on that service.
                  </li>
                </ul>
                <p className="font-bold text-destructive">
                  Reminder: Be specific about all data collected, including from third-party AI services like Google (Gemini). Check Google's terms regarding data they process.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">3. How We Use Your Information</h2>
                <p>
                  Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>Create and manage your account.</li>
                  <li>Process your outfit submissions and provide AI-generated feedback.</li>
                  <li>Operate and display the daily leaderboard.</li>
                  <li>Award LukuPoints and Badges.</li>
                  <li>Personalize and improve your experience.</li>
                  <li>Monitor and analyze usage and trends to improve the Service.</li>
                  <li>Communicate with you, including sending verification emails or responding to your inquiries.</li>
                  <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
                  <li>Comply with legal obligations.</li>
                </ul>

                <h2 className="text-lg font-semibold text-foreground pt-2">4. Disclosure of Your Information</h2>
                <p>
                  We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>
                    <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
                  </li>
                  <li>
                    <strong>Third-Party Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work. Examples include:
                    <ul className="list-circle list-inside pl-4">
                        <li>AI Model Providers (e.g., Google for Gemini model access via Genkit) for processing outfit images and generating feedback.</li>
                        <li>Cloud Hosting Providers (e.g., Firebase/Google Cloud) for data storage and application hosting.</li>
                    </ul>
                  </li>
                   <p className="font-bold text-destructive">
                    Reminder: Explicitly list types of third-party providers and for what purpose data is shared. Ensure their privacy policies align.
                   </p>
                  <li>
                    <strong>Publicly Visible Information:</strong> Your username, custom profile picture (if provided), submitted outfit images on the leaderboard, their AI ratings, LukuPoints, and Badges are publicly visible to other users of the Service. If you link your TikTok or Instagram, these links may also be visible on the leaderboard.
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
                  </li>
                  <li>
                    <strong>With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.
                  </li>
                </ul>

                <h2 className="text-lg font-semibold text-foreground pt-2">5. Data Security</h2>
                <p>
                  We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                </p>
                 <p className="font-bold text-destructive">
                    Reminder: Detail your specific security measures.
                 </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">6. Data Retention</h2>
                <p>
                  We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies. Outfit images submitted to the leaderboard may be retained as part of the historical leaderboard data.
                </p>
                 <p className="font-bold text-destructive">
                    Reminder: Specify retention periods for different data types.
                 </p>


                <h2 className="text-lg font-semibold text-foreground pt-2">7. Your Data Rights</h2>
                <p>
                  Depending on your jurisdiction, you may have certain rights regarding your personal information, such as the right to access, correct, delete, or restrict its processing. You can manage some of your information through your profile settings within the App, including deleting your account which will remove associated data as described in the app.
                </p>
                 <p className="font-bold text-destructive">
                    Reminder: Specify rights according to applicable laws (e.g., GDPR, CCPA). Explain how users can exercise these rights.
                 </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">8. Children's Privacy</h2>
                <p>
                  Our Service is not intended for use by children under the age of 13 (or a higher age if stipulated by applicable law in your jurisdiction). We do not knowingly collect personally identifiable information from children under this age.
                </p>
                 <p className="font-bold text-destructive">
                    Reminder: If you collect data from users under 16 (or other relevant age), specific rules (like COPPA in the US) may apply.
                 </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">9. Changes to This Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>

                <h2 className="text-lg font-semibold text-foreground pt-2">10. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at [Your Contact Email Address].
                </p>
                 <p className="font-bold text-destructive">
                  Reminder: Add your contact email.
                </p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
