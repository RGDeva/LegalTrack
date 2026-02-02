import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale, Shield, Clock, Users, FileText, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";

const LegalTrackLandingPage = () => {
  const navigate = useNavigate();

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
          <Button onClick={handleSignIn} variant="default">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Modern Practice Management
            <span className="block text-primary mt-2">Built for Legal Teams</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your legal practice with powerful case management, time tracking, billing, and client communication tools.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={handleSignIn} className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
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
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose LegalTrack?</h2>
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
