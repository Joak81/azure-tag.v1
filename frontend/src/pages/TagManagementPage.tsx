import React, { useState } from 'react';
import {
  Text,
  Button,
  Input,
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
  makeStyles,
  tokens,
  Badge,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Field,
  Textarea,
} from '@fluentui/react-components';
import {
  TagRegular,
  AddRegular,
  EditRegular,
  DeleteRegular,
  DocumentRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  templatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  templateCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
  },
  templateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  templateTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  templateDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginTop: '4px',
  },
  templateTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '12px',
  },
  templateActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    minWidth: 'auto',
  },
  currentTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
    padding: '8px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    minHeight: '40px',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
  },
});

interface TagTemplate {
  id: string;
  name: string;
  description: string;
  tags: Record<string, string>;
  category: string;
}

const mockTemplates: TagTemplate[] = [
  {
    id: '1',
    name: 'Production Environment',
    description: 'Standard tags for production resources',
    category: 'Environment',
    tags: {
      Environment: 'Production',
      Criticality: 'High',
      DataClassification: 'Internal',
      BackupRequired: 'Yes',
    },
  },
  {
    id: '2',
    name: 'Development Environment',
    description: 'Standard tags for development resources',
    category: 'Environment',
    tags: {
      Environment: 'Development',
      Criticality: 'Low',
      DataClassification: 'Internal',
      BackupRequired: 'No',
    },
  },
  {
    id: '3',
    name: 'Cost Center Template',
    description: 'Financial tracking tags',
    category: 'Finance',
    tags: {
      CostCenter: 'CC-IT-001',
      Department: 'Information Technology',
      BudgetCode: 'CAPEX-2024',
    },
  },
];

export const TagManagementPage: React.FC = () => {
  const styles = useStyles();
  const [templates, setTemplates] = useState<TagTemplate[]>(mockTemplates);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: '',
    tags: {} as Record<string, string>,
  });
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');

  const handleAddTag = () => {
    if (newTagKey.trim() && newTagValue.trim()) {
      setNewTemplate(prev => ({
        ...prev,
        tags: {
          ...prev.tags,
          [newTagKey.trim()]: newTagValue.trim(),
        },
      }));
      setNewTagKey('');
      setNewTagValue('');
    }
  };

  const handleRemoveTag = (key: string) => {
    setNewTemplate(prev => {
      const { [key]: removed, ...rest } = prev.tags;
      return { ...prev, tags: rest };
    });
  };

  const handleCreateTemplate = () => {
    if (newTemplate.name.trim()) {
      const template: TagTemplate = {
        id: Date.now().toString(),
        ...newTemplate,
      };
      setTemplates(prev => [...prev, template]);
      setNewTemplate({ name: '', description: '', category: '', tags: {} });
      setIsCreateDialogOpen(false);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Tag Management</Text>
        <Dialog open={isCreateDialogOpen} onOpenChange={(_, data) => setIsCreateDialogOpen(data.open)}>
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="primary" icon={<AddRegular />}>
              Create Template
            </Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Create Tag Template</DialogTitle>
              <DialogContent>
                <div className={styles.form}>
                  <Field label="Template Name" required>
                    <Input
                      value={newTemplate.name}
                      onChange={(_, data) => setNewTemplate(prev => ({ ...prev, name: data.value }))}
                      placeholder="Enter template name"
                    />
                  </Field>

                  <Field label="Description">
                    <Textarea
                      value={newTemplate.description}
                      onChange={(_, data) => setNewTemplate(prev => ({ ...prev, description: data.value }))}
                      placeholder="Enter template description"
                    />
                  </Field>

                  <Field label="Category">
                    <Input
                      value={newTemplate.category}
                      onChange={(_, data) => setNewTemplate(prev => ({ ...prev, category: data.value }))}
                      placeholder="e.g. Environment, Finance, Security"
                    />
                  </Field>

                  <Field label="Tags">
                    <div className={styles.formRow}>
                      <Input
                        className={styles.tagInput}
                        placeholder="Tag key"
                        value={newTagKey}
                        onChange={(_, data) => setNewTagKey(data.value)}
                      />
                      <Input
                        className={styles.tagInput}
                        placeholder="Tag value"
                        value={newTagValue}
                        onChange={(_, data) => setNewTagValue(data.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      />
                      <Button
                        className={styles.addTagButton}
                        appearance="secondary"
                        icon={<AddRegular />}
                        onClick={handleAddTag}
                      />
                    </div>
                    <div className={styles.currentTags}>
                      {Object.entries(newTemplate.tags).length === 0 ? (
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          No tags added yet
                        </Text>
                      ) : (
                        Object.entries(newTemplate.tags).map(([key, value]) => (
                          <Badge
                            key={key}
                            size="medium"
                            appearance="tint"
                            onClick={() => handleRemoveTag(key)}
                            style={{ cursor: 'pointer' }}
                          >
                            {key}: {value} ×
                          </Badge>
                        ))
                      )}
                    </div>
                  </Field>
                </div>
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary">Cancel</Button>
                </DialogTrigger>
                <Button appearance="primary" onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>

      <section className={styles.section}>
        <Text className={styles.sectionTitle}>Tag Templates</Text>
        <div className={styles.templatesGrid}>
          {templates.map((template) => (
            <Card key={template.id} className={styles.templateCard}>
              <CardHeader>
                <div className={styles.templateHeader}>
                  <div>
                    <Text className={styles.templateTitle}>{template.name}</Text>
                    <Text className={styles.templateDescription}>{template.description}</Text>
                  </div>
                  <Badge size="small" appearance="outline">
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>

              <CardPreview>
                <div className={styles.templateTags}>
                  {Object.entries(template.tags).map(([key, value]) => (
                    <Badge key={key} size="small" appearance="tint">
                      {key}: {value}
                    </Badge>
                  ))}
                </div>
              </CardPreview>

              <CardFooter>
                <div className={styles.templateActions}>
                  <Button
                    appearance="primary"
                    size="small"
                    icon={<TagRegular />}
                  >
                    Apply to Resources
                  </Button>
                  <Button
                    appearance="secondary"
                    size="small"
                    icon={<EditRegular />}
                  >
                    Edit
                  </Button>
                  <Button
                    appearance="secondary"
                    size="small"
                    icon={<DeleteRegular />}
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <Text className={styles.sectionTitle}>Quick Actions</Text>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button appearance="secondary" icon={<DocumentRegular />}>
            Import Templates from CSV
          </Button>
          <Button appearance="secondary" icon={<DocumentRegular />}>
            Export Templates
          </Button>
          <Button appearance="secondary" icon={<TagRegular />}>
            Bulk Apply Tags
          </Button>
          <Button appearance="secondary" icon={<DeleteRegular />}>
            Bulk Remove Tags
          </Button>
        </div>
      </section>
    </div>
  );
};