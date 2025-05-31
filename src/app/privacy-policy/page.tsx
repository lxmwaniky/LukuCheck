
'use client';

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const contactEmail = 'lxmwaniky@gmail.com';
  const appName = 'LukuCheck';
  const lastUpdatedDate = 'October 28, 2023'; // Update this manually when you make changes

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 container py-8 sm:py-12 md:py-10">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Privacy Policy for {appName}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] p-1 sm:p-3 border rounded-md">
              <div className="space-y-6 text-sm text-foreground/90">
                <p className="text-xs text-muted-foreground">Last updated: {lastUpdatedDate}</p>

                <p>
                  Welcome to {appName}! Your privacy is important to us. This Privacy Policy explains how we
                  (the creator of {appName}) collect, use, share, and protect your personal information when you use our
                  mobile application and website (collectively, the "Service").
                </p>
                <p>
                  By using {appName}, you agree to the collection and use of information in accordance with this policy.
                  If you have any questions, please contact us at{' '}
                  <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>.
                </p>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">1. Information We Collect</h2>
                  <p>We collect information to provide and improve our Service to you. The types of information we may collect include:</p>
                  <ul className="list-disc list-inside pl-4 space-y-2">
                    <li>
                      <strong>Account Information:</strong>
                      When you create an account, we collect your email address, chosen username, and a hashed version of your password.
                      If you sign up via a referral link, we may also store the UID of the user who referred you.
                    </li>
                    <li>
                      <strong>Profile Information (Optional):</strong>
                      You may choose to provide additional information for your profile, such as a profile picture,
                      links to your TikTok or Instagram profiles. This information, if provided, can be publicly visible.
                    </li>
                    <li>
                      <strong>Outfit Submissions & AI Interaction Data:</strong>
                      <ul className="list-circle list-inside pl-4 space-y-1 mt-1">
                        <li>
                          <strong>Outfit Images:</strong> We collect the images of outfits you upload for AI analysis and, if you choose, for submission to the daily leaderboard.
                        </li>
                        <li>
                          <strong>AI Feedback:</strong> We store the AI-generated rating, critiques, and suggestions associated with your outfit submissions that are posted to the leaderboard.
                        </li>
                      </ul>
                    </li>
                    <li>
                      <strong>Usage and Engagement Data:</strong>
                      We collect information about your interactions with the Service, such as your LukuPoints, earned Badges, LukuStreak progress, and AI usage counts (to manage daily limits). We also record the date of your last login and last outfit submission for streak calculations.
                    </li>
                    <li>
                      <strong>Technical Information (Automatically Collected):</strong>
                      Like most online services, we use Firebase which may automatically collect certain information when you use the Service, such as your IP address (which can be used to estimate your general location), device type, operating system, and access times. This is primarily for service operation, security, and analytics by Firebase.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">2. How We Use Your Information</h2>
                  <p>We use the information we collect for various purposes:</p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>To provide, operate, and maintain our Service (e.g., manage your account, process outfit uploads, display leaderboards, calculate LukuPoints and streaks).</li>
                    <li>To provide you with AI-powered feedback on your outfits.</li>
                    <li>To personalize your experience and allow you to participate in interactive features.</li>
                    <li>To communicate with you, such as sending email verification, responding to your support requests, or informing you about important updates to the Service or these policies.</li>
                    <li>To monitor and analyze usage and trends to improve the Service and develop new features.</li>
                    <li>To enforce our Terms of Service and maintain a safe and respectful community.</li>
                    <li>To process referrals and award relevant points/badges.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">3. How We Share Your Information</h2>
                  <p>We do not sell your personal information. We may share your information in the following limited circumstances:</p>
                  <ul className="list-disc list-inside pl-4 space-y-2">
                    <li>
                      <strong>Publicly on {appName}:</strong>
                        Certain information is public by the nature of the Service:
                        <ul className="list-circle list-inside pl-4 space-y-0.5 mt-1">
                            <li>Your username and profile picture (if you provide one).</li>
                            <li>Outfit images you submit to the leaderboard, along with their AI rating and feedback.</li>
                            <li>Your LukuPoints and earned Badges displayed on leaderboards or your profile.</li>
                            <li>Links to your TikTok or Instagram if you've added them to your profile and they are displayed on the leaderboard.</li>
                        </ul>
                    </li>
                    <li>
                      <strong>With Service Providers:</strong> We use third-party services to help us operate {appName}. These providers only have access to your information to perform tasks on our behalf and are obligated not to disclose or use it for other purposes.
                        <ul className="list-circle list-inside pl-4 space-y-0.5 mt-1">
                            <li>
                              <strong>Firebase (Google):</strong> For authentication, database (Firestore), image storage (Cloud Storage), and application hosting. Firebase's privacy policy applies to their data processing.
                            </li>
                            <li>
                              <strong>Google AI (Gemini via Genkit):</strong> When you submit an outfit for AI analysis, the image data is sent to Google's AI models for processing. Google's privacy policy and terms for their AI services apply. We only send the image; no other personal user data is sent with it for the analysis itself.
                            </li>
                        </ul>
                    </li>
                    <li>
                      <strong>For Legal Reasons:</strong> We may disclose your information if we believe it's reasonably necessary to comply with a law, regulation, legal process, or governmental request; to protect the safety of any person; to address fraud, security, or technical issues; or to protect our rights or property or the rights or property of our users.
                    </li>
                    <li>
                      <strong>Business Transfers:</strong> If {appName} is involved in a merger, acquisition, or asset sale, your information may be transferred. We would provide notice before your personal information is transferred and becomes subject to a different privacy policy.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">4. Data Security</h2>
                  <p>
                    We take reasonable measures to help protect your information from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. We rely on Firebase's security infrastructure for data storage and authentication. However, no internet or email transmission is ever fully secure or error-free. You are also responsible for keeping your account password confidential.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">5. Data Retention</h2>
                  <p>
                    We retain your personal information for as long as your account is active or as needed to provide you with the Service. If you delete your account, we will take steps to delete your personal information within a reasonable timeframe, subject to any legal obligations or operational backup requirements.
                  </p>
                  <p>
                    Information you have shared on public leaderboards (like outfit images and usernames) may remain visible as part of the historical record of the Service even after account deletion, though it would no longer be actively linked to a deletable account.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">6. Your Choices and Rights</h2>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>
                      <strong>Access and Update:</strong> You can access and update certain personal information (like your username, profile picture, social links) through your account settings in the App.
                    </li>
                    <li>
                      <strong>Account Deletion:</strong> You can request to delete your account through the App's profile settings. Deleting your account will remove your personal information from our active databases as described in "Data Retention."
                    </li>
                    <li>
                      <strong>Email Communications:</strong> You will receive transactional emails (like email verification). We currently do not send promotional emails.
                    </li>
                    <li>
                      <strong>Kenyan Data Protection Act:</strong> If you are in Kenya, you may have certain rights under the Data Protection Act, 2019, including the right to access your personal data, request correction or deletion, and object to processing in certain circumstances. To exercise these rights, please contact us.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">7. Children's Privacy</h2>
                  <p>
                    {appName} is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information without parental consent, we will take steps to delete such information and terminate the child's account.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">8. International Data Transfers</h2>
                  <p>
                    Your information, including personal data, may be transferred to — and maintained on — computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction (e.g., Firebase servers are often in the US). Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">9. Changes to This Privacy Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">10. Contact Us</h2>
                  <p>
                    If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:{' '}
                    <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>.
                  </p>
                </section>

                <p className="pt-4">Thank you for using {appName}!</p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
