import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { API_URL } from '@/lib/api-url';
import { toast } from 'sonner';

interface FieldDefinition {
  name: string;
  type: 'text' | 'longtext' | 'date' | 'url';
  required: boolean;
  value?: string;
}

interface Template {
  id: string;
  name: string;
  caseType: string;
  fields: FieldDefinition[];
  isDefault: boolean;
}

interface DynamicDetailsFormProps {
  caseId: string;
  caseType: string;
}

export function DynamicDetailsForm({ caseId, caseType }: DynamicDetailsFormProps) {
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseFields();
    fetchTemplates();
  }, [caseId, caseType]);

  const fetchCaseFields = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/case-field-templates/case/${caseId}/fields`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCustomFields(data.customFields || {});
      }
    } catch (error) {
      console.error('Error fetching case fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/case-field-templates/type/${caseType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const safeData = Array.isArray(data) ? data : [];
        setTemplates(safeData);
        
        // Auto-select default template if exists
        const defaultTemplate = safeData.find((t: Template) => t.isDefault);
        if (defaultTemplate && Object.keys(customFields).length === 0) {
          setSelectedTemplate(defaultTemplate);
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const applyTemplate = (template: Template) => {
    const newFields: Record<string, string> = {};
    template.fields.forEach(field => {
      newFields[field.name] = customFields[field.name] || '';
    });
    setCustomFields(newFields);
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  const saveFields = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/case-field-templates/case/${caseId}/fields`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customFields })
      });
      
      if (res.ok) {
        toast.success('Fields saved successfully');
        setIsEditing(false);
      } else {
        toast.error('Failed to save fields');
      }
    } catch (error) {
      console.error('Error saving fields:', error);
      toast.error('Failed to save fields');
    }
  };

  const addCustomField = () => {
    const fieldName = `custom_field_${Date.now()}`;
    setCustomFields({ ...customFields, [fieldName]: '' });
    setIsEditing(true);
  };

  const removeField = (fieldName: string) => {
    const newFields = { ...customFields };
    delete newFields[fieldName];
    setCustomFields(newFields);
    setIsEditing(true);
  };

  const updateFieldValue = (fieldName: string, value: string) => {
    setCustomFields({ ...customFields, [fieldName]: value });
    setIsEditing(true);
  };

  const getFieldType = (fieldName: string): string => {
    if (!selectedTemplate) return 'text';
    const field = selectedTemplate.fields.find(f => f.name === fieldName);
    return field?.type || 'text';
  };

  const renderField = (fieldName: string, value: string) => {
    const fieldType = getFieldType(fieldName);
    const displayName = fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    switch (fieldType) {
      case 'longtext':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateFieldValue(fieldName, e.target.value)}
            placeholder={`Enter ${displayName.toLowerCase()}`}
            rows={4}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateFieldValue(fieldName, e.target.value)}
          />
        );
      case 'url':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => updateFieldValue(fieldName, e.target.value)}
            placeholder="https://example.com"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => updateFieldValue(fieldName, e.target.value)}
            placeholder={`Enter ${displayName.toLowerCase()}`}
          />
        );
    }
  };

  if (loading) {
    return <div className="p-6">Loading case details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Case Details</h2>
          <p className="text-sm text-muted-foreground">
            Custom fields for this {caseType} case
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Layout className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Template</DialogTitle>
              </DialogHeader>
              <TemplateSelector
                templates={templates}
                onSelect={(template) => {
                  applyTemplate(template);
                  setShowTemplateDialog(false);
                }}
              />
            </DialogContent>
          </Dialog>
          
          {isEditing && (
            <Button onClick={saveFields}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Custom Fields</CardTitle>
            <Button variant="outline" size="sm" onClick={addCustomField}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(customFields).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No custom fields yet</p>
              <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                Apply a Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(customFields).map(([fieldName, value]) => (
                <div key={fieldName} className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={fieldName}>
                        {fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(fieldName)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    {renderField(fieldName, value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedTemplate.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.fields.length} fields
                </p>
              </div>
              {selectedTemplate.isDefault && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  Default
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TemplateSelector({ templates, onSelect }: { templates: Template[]; onSelect: (template: Template) => void }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No templates available</p>
        <Button onClick={() => setShowCreateDialog(true)}>
          Create Template
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => onSelect(template)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {template.fields.length} fields
                  </p>
                </div>
                {template.isDefault && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Button variant="outline" className="w-full" onClick={() => setShowCreateDialog(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create New Template
      </Button>
    </div>
  );
}
