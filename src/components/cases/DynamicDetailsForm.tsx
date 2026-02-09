import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Layout, Loader2, GripVertical, Pencil, Check, X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { API_URL } from '@/lib/api-url';
import { toast } from 'sonner';

interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'longtext' | 'date' | 'url' | 'number' | 'select';
  required: boolean;
  options?: string[];
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

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'longtext', label: 'Long Text' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Dropdown' },
];

const CASE_TYPES = [
  'General', 'Civil', 'Criminal', 'Family', 'Corporate',
  'Immigration', 'Real Estate', 'Employment', 'IP', 'Tax',
];

export function DynamicDetailsForm({ caseId, caseType }: DynamicDetailsFormProps) {
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [fieldMeta, setFieldMeta] = useState<FieldDefinition[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add field form
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<string>('text');

  // Rename field
  const [renamingField, setRenamingField] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    fetchCaseFields();
    fetchTemplates();
    fetchAllTemplates();
  }, [caseId, caseType]);

  const fetchCaseFields = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/case-field-templates/case/${caseId}/fields`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const cf = data.customFields || {};
        // customFields is stored as { _meta: [...], fieldKey: value, ... }
        if (cf._meta && Array.isArray(cf._meta)) {
          setFieldMeta(cf._meta);
        }
        const values: Record<string, string> = {};
        Object.entries(cf).forEach(([k, v]) => {
          if (k !== '_meta') values[k] = String(v ?? '');
        });
        setCustomFields(values);
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
        setTemplates(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchAllTemplates = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/case-field-templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllTemplates(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching all templates:', error);
    }
  };

  const applyTemplate = (template: Template) => {
    const newFields: Record<string, string> = {};
    const meta: FieldDefinition[] = [];
    template.fields.forEach(field => {
      const key = field.name;
      newFields[key] = customFields[key] || '';
      meta.push(field);
    });
    setCustomFields(newFields);
    setFieldMeta(meta);
    setSelectedTemplate(template);
    setIsEditing(true);
    setShowTemplateDialog(false);
    toast.success(`Template "${template.name}" applied`);
  };

  const saveFields = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      // Store meta alongside values
      const payload = { ...customFields, _meta: fieldMeta };
      const res = await fetch(`${API_URL}/case-field-templates/case/${caseId}/fields`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customFields: payload })
      });
      if (res.ok) {
        toast.success('Custom fields saved');
        setIsEditing(false);
      } else {
        toast.error('Failed to save fields');
      }
    } catch (error) {
      console.error('Error saving fields:', error);
      toast.error('Failed to save fields');
    } finally {
      setSaving(false);
    }
  };

  const addCustomField = () => {
    if (!newFieldName.trim()) {
      toast.error('Please enter a field name');
      return;
    }
    const key = newFieldName.trim().toLowerCase().replace(/\s+/g, '_');
    if (customFields.hasOwnProperty(key)) {
      toast.error('A field with this name already exists');
      return;
    }
    setCustomFields({ ...customFields, [key]: '' });
    setFieldMeta([...fieldMeta, {
      name: key,
      label: newFieldName.trim(),
      type: newFieldType as FieldDefinition['type'],
      required: false
    }]);
    setNewFieldName('');
    setNewFieldType('text');
    setShowAddField(false);
    setIsEditing(true);
  };

  const removeField = (fieldName: string) => {
    const newFields = { ...customFields };
    delete newFields[fieldName];
    setCustomFields(newFields);
    setFieldMeta(fieldMeta.filter(f => f.name !== fieldName));
    setIsEditing(true);
  };

  const renameField = (oldKey: string) => {
    if (!renameValue.trim()) return;
    const newKey = renameValue.trim().toLowerCase().replace(/\s+/g, '_');
    if (newKey !== oldKey && customFields.hasOwnProperty(newKey)) {
      toast.error('A field with this name already exists');
      return;
    }
    // Update values
    const newFields: Record<string, string> = {};
    Object.entries(customFields).forEach(([k, v]) => {
      newFields[k === oldKey ? newKey : k] = v;
    });
    setCustomFields(newFields);
    // Update meta
    setFieldMeta(fieldMeta.map(f =>
      f.name === oldKey ? { ...f, name: newKey, label: renameValue.trim() } : f
    ));
    setRenamingField(null);
    setRenameValue('');
    setIsEditing(true);
  };

  const updateFieldValue = (fieldName: string, value: string) => {
    setCustomFields({ ...customFields, [fieldName]: value });
    setIsEditing(true);
  };

  const getFieldMeta = (fieldName: string): FieldDefinition | undefined => {
    return fieldMeta.find(f => f.name === fieldName);
  };

  const getDisplayName = (fieldName: string): string => {
    const meta = getFieldMeta(fieldName);
    if (meta?.label) return meta.label;
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFieldType = (fieldName: string): string => {
    return getFieldMeta(fieldName)?.type || 'text';
  };

  const renderFieldInput = (fieldName: string, value: string) => {
    const fieldType = getFieldType(fieldName);
    const displayName = getDisplayName(fieldName);

    switch (fieldType) {
      case 'longtext':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateFieldValue(fieldName, e.target.value)}
            placeholder={`Enter ${displayName.toLowerCase()}`}
            rows={3}
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
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateFieldValue(fieldName, e.target.value)}
            placeholder={`Enter ${displayName.toLowerCase()}`}
          />
        );
      case 'url':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => updateFieldValue(fieldName, e.target.value)}
            placeholder="https://..."
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
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Case Details</h2>
          <p className="text-sm text-muted-foreground">
            Custom fields for this {caseType} case
            {selectedTemplate && (
              <> · Template: <span className="font-medium text-foreground">{selectedTemplate.name}</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplateDialog(true)}>
            <Layout className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddField(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
          {isEditing && (
            <Button size="sm" onClick={saveFields} disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Save</>
              )}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {Object.keys(customFields).length === 0 ? (
            <div className="text-center py-12">
              <Layout className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium mb-1">No custom fields yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Apply a template or add individual fields to track case-specific data.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                  <Layout className="h-4 w-4 mr-2" />
                  Apply Template
                </Button>
                <Button variant="outline" onClick={() => setShowAddField(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(customFields).map(([fieldName, value]) => {
                const meta = getFieldMeta(fieldName);
                return (
                  <div key={fieldName} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      {renamingField === fieldName ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="h-7 text-sm w-48"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') renameField(fieldName);
                              if (e.key === 'Escape') { setRenamingField(null); setRenameValue(''); }
                            }}
                          />
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => renameField(fieldName)}>
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setRenamingField(null); setRenameValue(''); }}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">{getDisplayName(fieldName)}</Label>
                          {meta?.type && (
                            <Badge variant="outline" className="text-[10px] h-5">
                              {FIELD_TYPES.find(t => t.value === meta.type)?.label || meta.type}
                            </Badge>
                          )}
                          {meta?.required && (
                            <span className="text-destructive text-xs">*</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { setRenamingField(fieldName); setRenameValue(getDisplayName(fieldName)); }}
                          title="Rename field"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => removeField(fieldName)}
                          title="Remove field"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {renderFieldInput(fieldName, value)}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Field Dialog */}
      <Dialog open={showAddField} onOpenChange={setShowAddField}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
            <DialogDescription>Add a new field to track case-specific data.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Field Name *</Label>
              <Input
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="e.g., Court Name, Filing Date"
                onKeyDown={(e) => { if (e.key === 'Enter') addCustomField(); }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select value={newFieldType} onValueChange={setNewFieldType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddField(false)}>Cancel</Button>
            <Button onClick={addCustomField}>Add Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Field Templates</DialogTitle>
            <DialogDescription>
              Apply a template to quickly add standard fields, or create a new one.
            </DialogDescription>
          </DialogHeader>
          {showCreateTemplate ? (
            <CreateTemplateForm
              caseType={caseType}
              currentFields={fieldMeta}
              onCreated={(template) => {
                setShowCreateTemplate(false);
                fetchTemplates();
                fetchAllTemplates();
                toast.success(`Template "${template.name}" created`);
              }}
              onCancel={() => setShowCreateTemplate(false)}
            />
          ) : (
            <div className="space-y-4">
              {/* Templates for this case type */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Templates for {caseType}
                  </p>
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => applyTemplate(template)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{template.name}</p>
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-[10px]">Default</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {Array.isArray(template.fields) ? template.fields.length : 0} fields
                          {Array.isArray(template.fields) && template.fields.length > 0 && (
                            <> · {template.fields.slice(0, 3).map(f => f.label || f.name).join(', ')}
                            {template.fields.length > 3 && `, +${template.fields.length - 3} more`}</>
                          )}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 ml-2">Apply</Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Other templates */}
              {allTemplates.filter(t => t.caseType !== caseType).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Other Templates
                  </p>
                  {allTemplates.filter(t => t.caseType !== caseType).map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => applyTemplate(template)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{template.name}</p>
                          <Badge variant="outline" className="text-[10px]">{template.caseType}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {Array.isArray(template.fields) ? template.fields.length : 0} fields
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 ml-2">Apply</Button>
                    </div>
                  ))}
                </div>
              )}

              {templates.length === 0 && allTemplates.length === 0 && (
                <div className="text-center py-6">
                  <Layout className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No templates yet. Create one to get started.</p>
                </div>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setShowCreateTemplate(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Template
                </Button>
                {Object.keys(customFields).length > 0 && (
                  <Button variant="outline" onClick={() => {
                    setShowCreateTemplate(true);
                  }} title="Save current fields as a template">
                    <Copy className="h-4 w-4 mr-2" />
                    Save Current as Template
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Create Template Form ────────────────────────────────────────

interface CreateTemplateFormProps {
  caseType: string;
  currentFields: FieldDefinition[];
  onCreated: (template: Template) => void;
  onCancel: () => void;
}

function CreateTemplateForm({ caseType, currentFields, onCreated, onCancel }: CreateTemplateFormProps) {
  const [name, setName] = useState('');
  const [templateCaseType, setTemplateCaseType] = useState(caseType);
  const [isDefault, setIsDefault] = useState(false);
  const [fields, setFields] = useState<FieldDefinition[]>(
    currentFields.length > 0 ? [...currentFields] : []
  );
  const [saving, setSaving] = useState(false);

  // New field inline
  const [addingField, setAddingField] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<string>('text');
  const [fieldRequired, setFieldRequired] = useState(false);

  const addField = () => {
    if (!fieldName.trim()) return;
    const key = fieldName.trim().toLowerCase().replace(/\s+/g, '_');
    if (fields.some(f => f.name === key)) {
      toast.error('Field name already exists');
      return;
    }
    setFields([...fields, {
      name: key,
      label: fieldName.trim(),
      type: fieldType as FieldDefinition['type'],
      required: fieldRequired
    }]);
    setFieldName('');
    setFieldType('text');
    setFieldRequired(false);
    setAddingField(false);
  };

  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (fields.length === 0) {
      toast.error('Add at least one field');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/case-field-templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          caseType: templateCaseType,
          fields,
          isDefault
        })
      });

      if (res.ok) {
        const template = await res.json();
        onCreated(template);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to create template');
      }
    } catch (error) {
      toast.error('Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Template Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Civil Litigation"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label>Case Type</Label>
          <Select value={templateCaseType} onValueChange={setTemplateCaseType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CASE_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={isDefault} onCheckedChange={setIsDefault} />
        <Label className="text-sm">Set as default template for {templateCaseType} cases</Label>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium">Fields ({fields.length})</Label>
          <Button variant="outline" size="sm" onClick={() => setAddingField(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Field
          </Button>
        </div>

        {fields.length === 0 && !addingField && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No fields yet. Add fields to define the template structure.
          </p>
        )}

        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{field.label}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[10px] h-4">
                    {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                  </Badge>
                  {field.required && (
                    <Badge variant="destructive" className="text-[10px] h-4">Required</Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeField(idx)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}

          {addingField && (
            <div className="p-3 border rounded-md border-dashed space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Field Name</Label>
                  <Input
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="e.g., Court Name"
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') addField(); }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={fieldType} onValueChange={setFieldType}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch checked={fieldRequired} onCheckedChange={setFieldRequired} />
                  <Label className="text-xs">Required</Label>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAddingField(false)}>Cancel</Button>
                  <Button size="sm" className="h-7 text-xs" onClick={addField}>Add</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : 'Create Template'}
        </Button>
      </div>
    </div>
  );
}
