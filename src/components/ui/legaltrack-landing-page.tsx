import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale, Shield, Clock, Users, FileText, TrendingUp, CheckCircle, ArrowRight, Moon, Sun, Play } from "lucide-react";

const LegalTrackLandingPage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Set light mode by default
    document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">LegalTrack</span>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#product" className="text-sm font-medium hover:text-primary transition-colors">
              Product
            </a>
            <a href="#solutions" className="text-sm font-medium hover:text-primary transition-colors">
              Solutions
            </a>
            <a href="#security" className="text-sm font-medium hover:text-primary transition-colors">
              Security
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#demo" className="text-sm font-medium hover:text-primary transition-colors">
              Demo
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button onClick={handleSignIn} variant="default">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center" id="demo">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Modern Practice Management
            <span className="block text-primary mt-2">Built for Legal Teams</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your legal practice with powerful case management, time tracking, billing, and client communication tools.
          </p>
          
          {/* Loom Video Embed */}
          <div className="max-w-3xl mx-auto mt-8">
            <div className="relative rounded-lg overflow-hidden shadow-2xl border">
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                <iframe 
                  src="https://www.loom.com/embed/7afce46e0b2b420991813dc70bef4615" 
                  frameBorder="0" 
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  title="LegalTrack Demo"
                />
              </div>
            </div>
            <a 
              href="https://www.loom.com/share/7afce46e0b2b420991813dc70bef4615" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
            >
              <Play className="h-4 w-4" />
              LegalTrack Demo - Watch Video
            </a>
          </div>

          {/* Get Started Button */}
          <div className="flex gap-4 justify-center pt-6">
            <Button size="lg" onClick={handleSignIn} className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20" id="product">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground text-lg">
            Comprehensive tools to manage your legal practice efficiently
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<FileText className="h-10 w-10 text-primary" />}
            title="Case Management"
            description="Organize and track all your cases in one place with powerful search and filtering capabilities."
          />
          <FeatureCard
            icon={<Clock className="h-10 w-10 text-primary" />}
            title="Time Tracking"
            description="Accurately track billable hours with integrated timers and manual time entry options."
          />
          <FeatureCard
            icon={<TrendingUp className="h-10 w-10 text-primary" />}
            title="Billing & Invoicing"
            description="Generate professional invoices and track payments with flexible billing codes."
          />
          <FeatureCard
            icon={<Users className="h-10 w-10 text-primary" />}
            title="Client Portal"
            description="Keep clients informed with a secure portal for documents and case updates."
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-primary" />}
            title="Secure & Compliant"
            description="Bank-level security with role-based access control and audit trails."
          />
          <FeatureCard
            icon={<FileText className="h-10 w-10 text-primary" />}
            title="Document Management"
            description="Store and organize case documents with Google Drive integration."
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-20" id="solutions">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Solutions for Every Practice</h2>
            <div className="space-y-6">
              <BenefitItem text="Increase billable hours with accurate time tracking" />
              <BenefitItem text="Reduce administrative overhead with automation" />
              <BenefitItem text="Improve client satisfaction with better communication" />
              <BenefitItem text="Make data-driven decisions with comprehensive reporting" />
              <BenefitItem text="Scale your practice without adding complexity" />
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="container mx-auto px-4 py-20" id="security">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Shield className="h-16 w-16 text-primary mx-auto" />
          <h2 className="text-3xl font-bold">Enterprise-Grade Security</h2>
          <p className="text-xl text-muted-foreground">
            Your data is protected with bank-level encryption, role-based access control, and comprehensive audit trails. We're committed to maintaining the highest security standards for your sensitive legal information.
          </p>
          <div className="grid md:grid-cols-3 gap-6 pt-8">
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Data Encryption</h3>
              <p className="text-sm text-muted-foreground">End-to-end encryption for all data in transit and at rest</p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Access Control</h3>
              <p className="text-sm text-muted-foreground">Granular permissions and role-based access management</p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Compliance</h3>
              <p className="text-sm text-muted-foreground">SOC 2 compliant with regular security audits</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-muted/50 py-20" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg">Choose the plan that fits your practice</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-lg border bg-card">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <div className="text-4xl font-bold mb-4">$49<span className="text-lg text-muted-foreground">/month</span></div>
              <p className="text-muted-foreground mb-6">Perfect for solo practitioners</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 50 cases</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Time tracking & billing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">5GB document storage</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">Get Started</Button>
            </div>
            <div className="p-8 rounded-lg border-2 border-primary bg-card relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <div className="text-4xl font-bold mb-4">$149<span className="text-lg text-muted-foreground">/month</span></div>
              <p className="text-muted-foreground mb-6">For growing law firms</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited cases</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 10 team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">50GB document storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Advanced reporting</span>
                </li>
              </ul>
              <Button className="w-full">Get Started</Button>
            </div>
            <div className="p-8 rounded-lg border bg-card">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="text-4xl font-bold mb-4">Custom</div>
              <p className="text-muted-foreground mb-6">For large organizations</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Everything in Professional</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Dedicated support</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold">Ready to Transform Your Practice?</h2>
          <p className="text-xl text-muted-foreground">
            Join leading law firms using LegalTrack to streamline their operations.
          </p>
          <Button size="lg" onClick={handleSignIn} className="gap-2">
            Start Your Free Trial <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 LegalTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

const BenefitItem = ({ text }: { text: string }) => {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
      <p className="text-lg">{text}</p>
    </div>
  );
};

export default LegalTrackLandingPage;
