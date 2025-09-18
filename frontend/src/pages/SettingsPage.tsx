import React, { useState } from 'react';
import {
  Text,
  Button,
  Input,
  Switch,
  Card,
  Field,
  Dropdown,
  Option,
  Textarea,
  makeStyles,
  tokens,
  Badge,
  Divider,
} from '@fluentui/react-components';
import {
  SettingsRegular,
  MailRegular,
  ShieldTaskRegular,
  TagRegular,
  SaveRegular,
  AddRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '800px',
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
  sectionCard: {
    padding: '24px',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  sectionIcon: {
    fontSize: '20px',
    color: tokens.colorBrandForeground1,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  addTagForm: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
    marginTop: '12px',
  },
  saveButton: {
    alignSelf: 'flex-start',
  },
});

interface RequiredTag {
  key: string;
  description: string;
  scope: 'global' | 'subscription' | 'resourceGroup';
}

export const SettingsPage: React.FC = () => {
  const styles = useStyles();

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    frequency: 'daily',
    recipients: ['admin@company.com', 'finops@company.com'],
    includeReports: true,
  });

  // Required Tags
  const [requiredTags, setRequiredTags] = useState<RequiredTag[]>([
    { key: 'Environment', description: 'Environment classification', scope: 'global' },
    { key: 'Owner', description: 'Resource owner email', scope: 'global' },
    { key: 'CostCenter', description: 'Cost center for billing', scope: 'subscription' },
  ]);

  const [newTag, setNewTag] = useState<{ key: string; description: string; scope: 'global' | 'subscription' | 'resourceGroup' }>({ key: '', description: '', scope: 'global' });
  const [newRecipient, setNewRecipient] = useState('');

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    autoTagging: false,
    inheritTags: true,
    validateTagValues: true,
    enableAuditLog: true,
    maxTagsPerResource: 15,
  });

  const handleAddRequiredTag = () => {
    if (newTag.key && newTag.description) {
      setRequiredTags([...requiredTags, newTag]);
      setNewTag({ key: '', description: '', scope: 'global' });
    }
  };

  const handleRemoveRequiredTag = (key: string) => {
    setRequiredTags(requiredTags.filter(tag => tag.key !== key));
  };

  const handleAddRecipient = () => {
    if (newRecipient && !emailSettings.recipients.includes(newRecipient)) {
      setEmailSettings({
        ...emailSettings,
        recipients: [...emailSettings.recipients, newRecipient],
      });
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setEmailSettings({
      ...emailSettings,
      recipients: emailSettings.recipients.filter(r => r !== email),
    });
  };

  const handleSaveSettings = () => {
    // In real implementation, this would save to backend
    console.log('Saving settings:', {
      emailSettings,
      requiredTags,
      generalSettings,
    });
  };

  return (
    <div className={styles.container}>
      <Text className={styles.title}>Settings</Text>

      {/* General Settings */}
      <Card className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <SettingsRegular className={styles.sectionIcon} />
          General Settings
        </div>

        <div className={styles.formColumn}>
          <Field>
            <Switch
              checked={generalSettings.autoTagging}
              onChange={(_, data) => setGeneralSettings({
                ...generalSettings,
                autoTagging: data.checked,
              })}
              label="Auto-tagging"
            />
            <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
              Automatically apply tags based on naming conventions
            </Text>
          </Field>

          <Field>
            <Switch
              checked={generalSettings.inheritTags}
              onChange={(_, data) => setGeneralSettings({
                ...generalSettings,
                inheritTags: data.checked,
              })}
              label="Inherit tags from resource groups"
            />
            <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
              New resources inherit tags from their resource group
            </Text>
          </Field>

          <Field>
            <Switch
              checked={generalSettings.validateTagValues}
              onChange={(_, data) => setGeneralSettings({
                ...generalSettings,
                validateTagValues: data.checked,
              })}
              label="Validate tag values"
            />
            <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
              Enforce tag value formats and allowed values
            </Text>
          </Field>

          <Field>
            <Switch
              checked={generalSettings.enableAuditLog}
              onChange={(_, data) => setGeneralSettings({
                ...generalSettings,
                enableAuditLog: data.checked,
              })}
              label="Enable audit logging"
            />
            <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
              Log all tag changes for compliance and auditing
            </Text>
          </Field>

          <Field label="Maximum tags per resource">
            <Input
              type="number"
              value={generalSettings.maxTagsPerResource.toString()}
              onChange={(_, data) => setGeneralSettings({
                ...generalSettings,
                maxTagsPerResource: parseInt(data.value) || 15,
              })}
              min={1}
              max={50}
            />
            <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
              Azure allows up to 50 tags per resource
            </Text>
          </Field>
        </div>
      </Card>

      {/* Required Tags */}
      <Card className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <TagRegular className={styles.sectionIcon} />
          Required Tags
        </div>

        <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginBottom: '16px' }}>
          Configure which tags are required for compliance across your organization
        </Text>

        <div className={styles.tagList}>
          {requiredTags.map((tag) => (
            <Badge
              key={tag.key}
              size="large"
              appearance="tint"
              style={{ cursor: 'pointer' }}
              onClick={() => handleRemoveRequiredTag(tag.key)}
            >
              {tag.key} ({tag.scope}) ×
            </Badge>
          ))}
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <div className={styles.formGrid}>
          <Field label="Tag Key">
            <Input
              value={newTag.key}
              onChange={(_, data) => setNewTag({ ...newTag, key: data.value })}
              placeholder="e.g. Environment"
            />
          </Field>

          <Field label="Scope">
            <Dropdown
              value={newTag.scope}
              onOptionSelect={(_, data) => setNewTag({
                ...newTag,
                scope: data.optionValue as 'global' | 'subscription' | 'resourceGroup'
              })}
            >
              <Option value="global">Global</Option>
              <Option value="subscription">Subscription</Option>
              <Option value="resourceGroup">Resource Group</Option>
            </Dropdown>
          </Field>
        </div>

        <Field label="Description">
          <Input
            value={newTag.description}
            onChange={(_, data) => setNewTag({ ...newTag, description: data.value })}
            placeholder="Describe the purpose of this tag"
          />
        </Field>

        <Button
          appearance="secondary"
          icon={<AddRegular />}
          onClick={handleAddRequiredTag}
          disabled={!newTag.key || !newTag.description}
        >
          Add Required Tag
        </Button>
      </Card>

      {/* Email Notifications */}
      <Card className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <MailRegular className={styles.sectionIcon} />
          Email Notifications
        </div>

        <div className={styles.formColumn}>
          <Field>
            <Switch
              checked={emailSettings.enabled}
              onChange={(_, data) => setEmailSettings({
                ...emailSettings,
                enabled: data.checked,
              })}
              label="Enable email notifications"
            />
          </Field>

          <Field label="Notification Frequency">
            <Dropdown
              value={emailSettings.frequency}
              onOptionSelect={(_, data) => setEmailSettings({
                ...emailSettings,
                frequency: data.optionValue || 'daily',
              })}
              disabled={!emailSettings.enabled}
            >
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
            </Dropdown>
          </Field>

          <Field label="Recipients">
            <div className={styles.tagList}>
              {emailSettings.recipients.map((email) => (
                <Badge
                  key={email}
                  size="medium"
                  appearance="tint"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleRemoveRecipient(email)}
                >
                  {email} ×
                </Badge>
              ))}
            </div>
            <div className={styles.addTagForm}>
              <Input
                placeholder="Add email recipient"
                value={newRecipient}
                onChange={(_, data) => setNewRecipient(data.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
              />
              <Button
                appearance="secondary"
                icon={<AddRegular />}
                onClick={handleAddRecipient}
                disabled={!newRecipient}
              >
                Add
              </Button>
            </div>
          </Field>

          <Field>
            <Switch
              checked={emailSettings.includeReports}
              onChange={(_, data) => setEmailSettings({
                ...emailSettings,
                includeReports: data.checked,
              })}
              label="Include compliance reports in emails"
              disabled={!emailSettings.enabled}
            />
          </Field>
        </div>
      </Card>

      {/* Compliance Policies */}
      <Card className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <ShieldTaskRegular className={styles.sectionIcon} />
          Compliance Policies
        </div>

        <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginBottom: '16px' }}>
          Define policies that will be enforced across your Azure environment
        </Text>

        <div className={styles.formColumn}>
          <Field label="Tag Naming Convention">
            <Input
              placeholder="e.g. [A-Za-z][A-Za-z0-9]*"
              defaultValue="[A-Za-z][A-Za-z0-9]*"
            />
            <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
              Regular expression for valid tag key names
            </Text>
          </Field>

          <Field label="Allowed Environment Values">
            <Textarea
              placeholder="Enter allowed values, one per line"
              defaultValue="Development&#10;Staging&#10;Production"
            />
          </Field>

          <Field label="Grace Period for New Resources (hours)">
            <Input
              type="number"
              defaultValue="24"
              min={1}
              max={168}
            />
            <Text size={200} style={{ color: tokens.colorNeutralForeground2, marginTop: '4px' }}>
              Time allowed for new resources to be properly tagged
            </Text>
          </Field>
        </div>
      </Card>

      <Button
        appearance="primary"
        icon={<SaveRegular />}
        className={styles.saveButton}
        onClick={handleSaveSettings}
      >
        Save Settings
      </Button>
    </div>
  );
};