
'use client';

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const contactEmail = 'lxmwaniky@gmail.com';
  const appName = 'LukuCheck';
  // Remember to update this date if you make significant changes to this policy!
  const lastUpdatedDate = 'May 31, 2025'; 

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <SiteHeader />
      <main className="flex-1 container py-8 sm:py-12 md:py-10">
        <Card className="max-w-3xl mx-auto shadow-lg bg-white/80 backdrop-blur dark:bg-gray-800/80">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl">Privacy Policy for {appName}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] p-1 sm:p-3 border rounded-md">
              <div className="space-y-6 text-sm text-foreground/90">
                <p className="text-xs text-muted-foreground">Last updated: {lastUpdatedDate}</p>

                <p>
                  Welcome to {appName}! Your privacy is important to us. This Privacy Policy explains how we
                  (the individual creator of {appName}) collect, use, share, and protect your personal information when you use our
                  mobile application and website (collectively, the "Service"). {appName} is intended for fun and entertainment, and we are committed to handling your data responsibly.
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
                      Your email is used for account verification, password resets, and essential Service communications.
                      If you sign up via a referral link, we may also store the UID of the user who referred you to award points appropriately.
                    </li>
                    <li>
                      <strong>Profile Information (Optional):</strong>
                      You may choose to provide additional information for your profile, such as a profile picture,
                      links to your TikTok or Instagram profiles. This information, if provided, can be publicly visible within the App (e.g., on leaderboards or your profile page). You control what optional profile information you provide.
                    </li>
                    <li>
                      <strong>Outfit Submissions & AI Interaction Data:</strong>
                      <ul className="list-circle list-inside pl-4 space-y-1 mt-1">
                        <li>
                          <strong>Outfit Images:</strong> We collect the images of outfits you upload. These images are sent to our AI service provider for analysis. If you choose to submit your rated outfit to the daily leaderboard, the image and its AI rating will be stored and publicly displayed within the App on that leaderboard.
                        </li>
                        <li>
                          <strong>AI Feedback:</strong> We store the AI-generated rating, critiques, and suggestions associated with your outfit submissions that are posted to the leaderboard. This is displayed publicly alongside your outfit on the leaderboard.
                        </li>
                        <li>
                          <strong>User Responsibility for Images:</strong> You are responsible for the images you upload. Please ensure you have the right to use them and that they do not contain sensitive personal information you do not wish to share, especially if submitting to the public leaderboard. Crucially, do not upload images of other people without their explicit consent (see our <Link href="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>).
                        </li>
                      </ul>
                    </li>
                    <li>
                      <strong>Usage and Engagement Data:</strong>
                      We collect information about your interactions with the Service, such as your LukuPoints earned, Badges achieved, LukuStreak progress (based on submission dates), and AI usage counts (to manage daily limits, this count resets daily). We also record the date of your last login (for system maintenance) and last outfit submission (for streak calculations).
                    </li>
                    <li>
                      <strong>Technical Information (Automatically Collected via Firebase):</strong>
                      Our Service is built on Firebase (a Google platform). Firebase may automatically collect certain technical information when you use the Service, such as your IP address (which can be used to estimate your general location), device type, operating system, Firebase installation IDs, and access times. This information is primarily used by Firebase for service operation, security, analytics, and to ensure the reliability of their services. We, as the {appName} creator, have limited access to this raw data, primarily in aggregated or anonymized forms for understanding app usage. Please refer to Firebase's privacy policy for more details on their data collection.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">2. How We Use Your Information</h2>
                  <p>We use the information we collect for the following purposes:</p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>To provide, operate, and maintain our Service (e.g., manage your account, authenticate you, process outfit uploads, display leaderboards, calculate LukuPoints and streaks).</li>
                    <li>To provide you with AI-powered feedback on your outfits.</li>
                    <li>To personalize your experience within the App, such as displaying your username and profile picture.</li>
                    <li>To communicate with you for essential service-related purposes, such as sending email verification, password reset emails, or important updates regarding the Service or these policies. We do not currently send marketing or promotional emails.</li>
                    <li>To monitor and analyze usage and trends to improve the Service, identify bugs, and develop new features.</li>
                    <li>To enforce our <Link href="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link> and maintain a safe, respectful, and fair community.</li>
                    <li>To process referrals and award relevant points/badges.</li>
                    <li>To manage AI usage limits and ensure fair access to AI features.</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">3. How We Share Your Information</h2>
                  <p>We understand the importance of your privacy and do not sell your personal information. We may share your information only in the following limited circumstances:</p>
                  <ul className="list-disc list-inside pl-4 space-y-2">
                    <li>
                      <strong>Publicly on {appName} (Information YOU Choose to Make Public):</strong>
                        Certain information is public by the nature of the Service if you participate in public features:
                        <ul className="list-circle list-inside pl-4 space-y-0.5 mt-1">
                            <li>Your username and profile picture (if you provide one) are visible on leaderboards and your profile.</li>
                            <li>Outfit images you submit to the leaderboard, along with their AI rating and associated AI feedback, are publicly visible on the leaderboard for that day.</li>
                            <li>Your LukuPoints total and earned Badges may be displayed on leaderboards or your profile.</li>
                            <li>Links to your TikTok or Instagram if you've added them to your profile and they are displayed on the leaderboard.</li>
                        </ul>
                        <p className="mt-1">You are responsible for ensuring you have the necessary rights and consents for any content, particularly images featuring identifiable individuals, that you make public through the Service. Please refer to our <Link href="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link> for content standards.</p>
                    </li>
                    <li>
                      <strong>With Service Providers (Third Parties):</strong> We use third-party services to help us operate {appName}. These providers only have access to your information to perform tasks on our behalf and are obligated (by us or by their own terms) not to disclose or use it for other purposes.
                        <ul className="list-circle list-inside pl-4 space-y-0.5 mt-1">
                            <li>
                              <strong>Firebase (Google):</strong> We use Firebase for core functionalities including authentication, database (Firestore for user profiles, leaderboard data, etc.), image storage (Cloud Storage for outfit and profile pictures), and application hosting. Firebase's privacy policy and terms apply to their data processing. You can learn more about Firebase's privacy practices on their website.
                            </li>
                            <li>
                              <strong>Google AI (Gemini models via Genkit):</strong> When you submit an outfit for AI analysis, the image data is sent to Google's AI models for processing to generate the rating and feedback. No other personal user data (like your UID or email) is sent with the image for the analysis itself. Google's privacy policy and terms for their AI services apply to this processing.
                            </li>
                        </ul>
                    </li>
                    <li>
                      <strong>For Legal Reasons or to Prevent Harm:</strong> We may disclose your information if we believe in good faith that it's reasonably necessary to:
                        <ul className="list-circle list-inside pl-4 space-y-0.5 mt-1">
                            <li>Comply with a law, regulation, valid legal process (e.g., a subpoena or court order), or governmental request.</li>
                            <li>Protect the safety, rights, or property of any person, {appName}, its creator, or the public.</li>
                            <li>Detect, prevent, or otherwise address fraud, security, or technical issues.</li>
                            <li>Enforce our <Link href="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>.</li>
                        </ul>
                    </li>
                    <li>
                      <strong>Business Transfers/Project Evolution:</strong> If {appName} (or its assets) were to be acquired, or if the project evolves into a more formal entity or is transferred to another party, your user information would likely be one of the assets transferred or acquired by a third party. We would endeavor to provide notice (e.g., via the App or your registered email) if your personal information becomes subject to a different privacy policy.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">4. Data Security</h2>
                  <p>
                    We take reasonable measures to help protect your information from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. We primarily rely on Firebase's security infrastructure for data storage (encryption at rest, secure data centers) and authentication (hashed passwords, secure protocols). However, please remember that no internet or email transmission is ever fully secure or error-free, and no security system is impenetrable. You are also responsible for keeping your account password confidential and using a strong, unique password.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">5. Data Retention</h2>
                  <p>
                    We retain your personal information for as long as your account is active or as needed to provide you with the Service and achieve the purposes described in this policy.
                  </p>
                  <div>
                    <p>If you delete your account:</p>
                    <ul className="list-disc list-inside pl-4 space-y-1 mt-1">
                      <li>We will take steps to delete your primary account information (profile data, AI usage logs directly tied to your UID) from our active databases within a reasonable timeframe (e.g., 30-90 days), subject to any legal obligations or operational backup requirements.</li>
                      <li>Outfit images you submitted to public leaderboards and their associated AI feedback (linked to your username at the time of submission) may remain visible as part of the historical record of the Service. This is because leaderboards are a core part of the app's public, historical nature. However, if your account is deleted, these entries would no longer be actively linked to a deletable account in our system.</li>
                      <li>Firebase may retain backup copies of data for a longer period as per their data retention policies.</li>
                    </ul>
                  </div>
                  <p>We may also retain anonymized or aggregated data that does not personally identify you for analytical or service improvement purposes indefinitely.</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">6. Your Choices and Rights</h2>
                  <p>You have certain choices and rights regarding your personal information:</p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>
                      <strong>Access and Update:</strong> You can access and update certain personal information (like your username, profile picture, optional social links) through your account settings within the App. Your email address cannot be changed after account creation.
                    </li>
                    <li>
                      <strong>Account Deletion:</strong> You can request to delete your account through the App's profile settings. This will initiate the data deletion process as described in the "Data Retention" section. Please note that account deletion is permanent and irreversible.
                    </li>
                    <li>
                      <strong>Email Communications:</strong> You will receive transactional emails (like email verification for account creation and password resets). We do not currently send marketing or promotional emails.
                    </li>
                    <li>
                      <strong>Data Protection Rights (e.g., under Kenyan Law):</strong> If you are in Kenya, you may have certain rights under the Data Protection Act, 2019, including the right to access your personal data, request correction or deletion of your data, object to processing in certain circumstances, and the right to data portability. To exercise these rights, or if you have questions about them, please contact us at <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>. We will respond to your request within a reasonable timeframe and in accordance with applicable law.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">7. Children's Privacy</h2>
                  <p>
                    {appName} is not intended for or directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information without verifiable parental consent, we will take steps to delete such information from our files and terminate the child's account. If you believe we might have any information from or about a child under 13, please contact us.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">8. International Data Transfers</h2>
                  <p>
                    Your information, including personal data, may be transferred to — and maintained on — computers and servers located outside of your state, province, country (including Kenya), or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction. For example, Firebase servers, which we use, are located globally, including in the United States. Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer. We will take steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">9. Changes to This Privacy Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our practices, the Service, or for other operational, legal, or regulatory reasons. If we make material changes, we will notify you by updating the "Last updated" date at the top of this policy and may provide additional notice through the App or via your registered email address prior to the change becoming effective. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground pt-2">10. Contact Us</h2>
                  <p>
                    If you have any questions, concerns, or feedback about this Privacy Policy, our data practices, or if you wish to exercise your privacy rights, please contact us at:{' '}
                    <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>.
                  </p>
                  <p>
                    As {appName} is based in Kenya, we strive to comply with the Kenyan Data Protection Act, 2019.
                  </p>
                </section>

                <p className="pt-4">Thank you for using {appName} and for taking the time to understand our privacy practices!</p>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
