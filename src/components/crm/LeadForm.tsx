import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { API_URL } from '@/lib/api-url';

interface LeadFormProps {
  customFields?: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
    required?: boolean;
    options?: string[];
  }>;
  source?: string;
  onSuccess?: () => void;
  embedded?: boolean;
}

export function LeadForm({ customFields = [], source = 'website', onSuccess, embedded = false }: LeadFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Extract custom fields
      const customFieldsData: Record<string, string> = {};
      customFields.forEach(field => {
        if (formData[field.name]) {
          customFieldsData[field.name] = formData[field.name];
        }
      });

      const res = await fetch(`${API_URL}/lead-forms/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          customFields: customFieldsData,
          source
        })
      });

      if (res.ok) {
        setSubmitted(true);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit form');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  if (submitted) {
    return (
      <Card className={embedded ? 'border-0 shadow-none' : ''}>
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
          <p className="text-muted-foreground">
            We've received your inquiry and will get back to you shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            placeholder="John Doe"
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Custom Fields */}
      {customFields.map((field) => (
        <div key={field.name}>
          <Label htmlFor={field.name}>
            {field.label} {field.required && '*'}
          </Label>
          {field.type === 'textarea' ? (
            <Textarea
              id={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              rows={3}
            />
          ) : field.type === 'select' ? (
            <select
              id={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">Select...</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={field.name}
              type={field.type}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
            />
          )}
        </div>
      ))}

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          placeholder="Tell us about your legal needs..."
          rows={4}
        />
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          'Submitting...'
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Submit Inquiry
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By submitting this form, you agree to our privacy policy.
      </p>
    </form>
  );

  if (embedded) {
    return <div className="max-w-2xl mx-auto p-6">{formContent}</div>;
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Get in Touch</CardTitle>
        <CardDescription>
          Fill out the form below and we'll get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

// Embeddable version with minimal styling
export function EmbeddableLeadForm(props: LeadFormProps) {
  return <LeadForm {...props} embedded={true} />;
}

// Generate embed code for external websites
export function generateEmbedCode(customFields?: any[], source?: string): string {
  const config = {
    customFields: customFields || [],
    source: source || 'external_website'
  };

  return `<!-- LegalTrack Lead Form -->
<div id="legaltrack-lead-form"></div>
<script>
  (function() {
    const config = ${JSON.stringify(config, null, 2)};
    const script = document.createElement('script');
    script.src = '${window.location.origin}/embed/lead-form.js';
    script.async = true;
    script.onload = function() {
      if (window.LegalTrackLeadForm) {
        window.LegalTrackLeadForm.init('legaltrack-lead-form', config);
      }
    };
    document.head.appendChild(script);
  })();
</script>`;
}
