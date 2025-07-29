import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Code, Sparkles, Users, Trophy, Lightbulb, Heart, Rocket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Alex Nyambura - Creator of LukuCheck',
  description: 'Learn about Alex Nyambura, the innovative developer and creator behind LukuCheck, a revolutionary AI-powered fashion rating app that combines technology with style community.',
  keywords: [
    'Alex Nyambura',
    'LukuCheck creator',
    'fashion app developer',
    'AI fashion technology',
    'tech innovator',
    'software developer',
    'fashion AI pioneer',
    'tech entrepreneur',
    'mobile app developer',
    'web developer'
  ],
  openGraph: {
    title: 'About Alex Nyambura - Creator of LukuCheck',
    description: 'Learn about Alex Nyambura, the innovative developer and creator behind LukuCheck, a revolutionary AI-powered fashion rating app.',
    type: 'profile',
  },
  alternates: {
    canonical: 'https://lukucheck.lxmwaniky.me/about-alex-nyambura',
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Alex Nyambura",
  "jobTitle": "Software Developer & Tech Innovator",
  "description": "Creator of LukuCheck - AI-powered fashion rating app. Passionate about combining technology with creative communities.",
  "url": "https://lukucheck.lxmwaniky.me/about-alex-nyambura",
  "sameAs": [
    "https://lukucheck.lxmwaniky.me",
    "https://github.com/lxmwaniky"
  ],
  "worksFor": {
    "@type": "Organization",
    "name": "LukuCheck"
  },
  "knowsAbout": [
    "Software Development",
    "Artificial Intelligence",
    "Fashion Technology",
    "Mobile App Development",
    "Web Development",
    "React",
    "Next.js",
    "Firebase",
    "AI Integration"
  ],
  "creator": {
    "@type": "SoftwareApplication",
    "name": "LukuCheck",
    "description": "AI-powered fashion rating and community app",
    "url": "https://lukucheck.lxmwaniky.me"
  }
};

export default function AboutAlexPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <SiteHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Alex Nyambura
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Software Developer, Tech Innovator & Creator of LukuCheck
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Code className="h-3 w-3" />
                Developer
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Enthusiast
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Community Builder
              </Badge>
            </div>
          </div>

          <Separator />

          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                About Alex
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg leading-relaxed">
                Alex Nyambura is a passionate software developer and tech innovator who combines creativity 
                with cutting-edge technology. As the creator of <strong>LukuCheck</strong>, Alex has pioneered 
                a unique platform that merges artificial intelligence with fashion community engagement.
              </p>
              <p className="leading-relaxed">
                With a deep understanding of both technology and user experience, Alex has built LukuCheck 
                to be more than just an app – it's a vibrant community where fashion enthusiasts can discover, 
                share, and improve their style through AI-powered insights and peer interaction.
              </p>
            </CardContent>
          </Card>

          {/* LukuCheck Project */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                LukuCheck: The Vision Realized
              </CardTitle>
              <CardDescription>
                AI-Powered Fashion Rating and Community Platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-relaxed">
                LukuCheck represents Alex's vision of democratizing fashion feedback through technology. 
                The platform features:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>AI-Powered Analysis:</strong> Advanced algorithms provide detailed outfit ratings and style suggestions</li>
                <li><strong>Community Leaderboards:</strong> Daily competitions that foster engagement and friendly competition</li>
                <li><strong>Gamification:</strong> Points, badges, and achievements that reward user participation</li>
                <li><strong>Social Integration:</strong> Seamless connection with TikTok and Instagram profiles</li>
                <li><strong>Mobile-First Design:</strong> Cross-platform compatibility with responsive web and native mobile apps</li>
              </ul>
            </CardContent>
          </Card>

          {/* Technical Expertise */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Technical Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Frontend Technologies</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">Next.js</Badge>
                    <Badge variant="outline">TypeScript</Badge>
                    <Badge variant="outline">Tailwind CSS</Badge>
                    <Badge variant="outline">Capacitor</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Backend & AI</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">Firebase</Badge>
                    <Badge variant="outline">Google AI</Badge>
                    <Badge variant="outline">Genkit</Badge>
                    <Badge variant="outline">Cloud Functions</Badge>
                    <Badge variant="outline">Firestore</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Innovation & Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Innovation & Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-relaxed">
                Through LukuCheck, Alex has created a platform that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Empowers users to receive constructive fashion feedback in a supportive environment</li>
                <li>Leverages AI to provide personalized style recommendations</li>
                <li>Builds community through gamification and social features</li>
                <li>Demonstrates the potential of AI in creative industries</li>
                <li>Provides a model for tech-enabled community building</li>
              </ul>
            </CardContent>
          </Card>

          {/* Vision */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Vision & Philosophy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed">
                Alex believes in the power of technology to bring people together and enhance creativity. 
                Through LukuCheck, the goal is to create a space where fashion enthusiasts can grow, 
                learn, and express themselves while building meaningful connections with others who share 
                their passion for style and self-expression.
              </p>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center space-y-4 py-8">
            <h2 className="text-2xl font-bold">Experience Alex's Innovation</h2>
            <p className="text-muted-foreground">
              Try LukuCheck today and see how AI can enhance your fashion journey
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Try LukuCheck
              </a>
              <a 
                href="https://github.com/lxmwaniky/LukuCheck"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}
