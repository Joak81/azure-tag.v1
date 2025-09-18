import React, { useState, useEffect } from 'react';
import {
  Text,
  Button,
  Input,
  Dropdown,
  Option,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridCell,
  DataGridBody,
  TableColumnDefinition,
  createTableColumn,
  makeStyles,
  tokens,
  Badge,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Checkbox,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  SearchRegular,
  FilterRegular,
  TagRegular,
  MoreVerticalRegular,
  EditRegular,
  DeleteRegular,
  ErrorCircleRegular,
  InfoRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    height: '100%',
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
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  searchInput: {
    minWidth: '200px',
  },
  dropdown: {
    minWidth: '150px',
  },
  dataGridContainer: {
    flex: 1,
    overflow: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  tagBadge: {
    margin: '2px',
  },
  tagsCell: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    maxWidth: '200px',
  },
  actionButton: {
    minWidth: 'auto',
  },
  bulkActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
});

interface Resource {
  id: string;
  name: string;
  type: string;
  resourceGroup: string;
  subscription: string;
  subscriptionId: string;
  location: string;
  tags: Record<string, string>;
  selected?: boolean;
}

interface TagInfo {
  key: string;
  values: string[];
}

interface SubscriptionInfo {
  subscriptionId: string;
  displayName: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Mock data for development
const mockResources: Resource[] = [
  {
    id: '1',
    name: 'webapp-prod-001',
    type: 'Microsoft.Web/sites',
    resourceGroup: 'rg-prod-web',
    subscription: 'Production Subscription',
    subscriptionId: 'sub-prod-001',
    location: 'West Europe',
    tags: { Environment: 'Production', Owner: 'team-web@company.com', CostCenter: 'CC-001' },
  },
  {
    id: '2',
    name: 'storage-logs-001',
    type: 'Microsoft.Storage/storageAccounts',
    resourceGroup: 'rg-prod-storage',
    subscription: 'Production Subscription',
    subscriptionId: 'sub-prod-001',
    location: 'West Europe',
    tags: { Environment: 'Production', Project: 'Logging' },
  },
  {
    id: '3',
    name: 'vm-dev-web-001',
    type: 'Microsoft.Compute/virtualMachines',
    resourceGroup: 'rg-dev-compute',
    subscription: 'Development Subscription',
    subscriptionId: 'sub-dev-001',
    location: 'North Europe',
    tags: { Environment: 'Development' },
  },
  {
    id: '4',
    name: 'untagged-storage-001',
    type: 'Microsoft.Storage/storageAccounts',
    resourceGroup: 'rg-test',
    subscription: 'Test Subscription',
    subscriptionId: 'sub-test-001',
    location: 'North Europe',
    tags: {},
  },
];

export const ResourcesPage: React.FC = () => {
  const styles = useStyles();
  const [resources, setResources] = useState<Resource[]>([]);
  const [allTags, setAllTags] = useState<TagInfo[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState<string>('');
  const [selectedResourceGroup, setSelectedResourceGroup] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedMissingTags, setSelectedMissingTags] = useState<string[]>([]);
  const [showOnlyResourcesWithoutTags, setShowOnlyResourcesWithoutTags] = useState(false);

  const selectedResourcesCount = resources.filter(r => r.selected).length;

  // API base URL from environment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  const handleResourceSelection = (resourceId: string, selected: boolean) => {
    setResources(prev =>
      prev.map(r => r.id === resourceId ? { ...r, selected } : r)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setResources(prev => prev.map(r => ({ ...r, selected })));
  };

  // Load initial data
  useEffect(() => {
    loadSubscriptions();
    loadAllTags();
    loadResources();
  }, []);

  // Load subscriptions
  const loadSubscriptions = async () => {
    try {
      // For now, use mock data. In production, this would fetch from API
      setSubscriptions([
        { subscriptionId: 'sub-prod-001', displayName: 'Production Subscription' },
        { subscriptionId: 'sub-dev-001', displayName: 'Development Subscription' },
        { subscriptionId: 'sub-test-001', displayName: 'Test Subscription' },
      ]);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    }
  };

  // Load all available tags
  const loadAllTags = async () => {
    try {
      // For now, use mock data. In production, this would fetch from API
      setAllTags([
        { key: 'Environment', values: ['Production', 'Development', 'Test'] },
        { key: 'Owner', values: ['team-web@company.com', 'team-data@company.com'] },
        { key: 'CostCenter', values: ['CC-001', 'CC-002', 'CC-003'] },
        { key: 'Project', values: ['Logging', 'Analytics', 'Web'] },
      ]);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  // Load resources with current filters
  const loadResources = async () => {
    setLoading(true);
    setError('');

    try {
      // For now, use mock data. In production, this would fetch from API
      let filteredResources = [...mockResources];

      // Apply filters
      if (searchTerm) {
        filteredResources = filteredResources.filter(resource =>
          resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (selectedSubscription) {
        filteredResources = filteredResources.filter(resource =>
          resource.subscriptionId === selectedSubscription
        );
      }

      if (selectedType) {
        filteredResources = filteredResources.filter(resource =>
          resource.type === selectedType
        );
      }

      if (showOnlyResourcesWithoutTags) {
        filteredResources = filteredResources.filter(resource =>
          !resource.tags || Object.keys(resource.tags).length === 0
        );
      }

      if (selectedMissingTags.length > 0) {
        filteredResources = filteredResources.filter(resource => {
          if (!resource.tags) return true; // No tags means missing all tags
          return selectedMissingTags.some(tag => !Object.keys(resource.tags).includes(tag));
        });
      }

      setResources(filteredResources);
    } catch (err) {
      setError('Failed to load resources. Please try again.');
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reload resources when filters change
  useEffect(() => {
    loadResources();
  }, [searchTerm, selectedSubscription, selectedType, selectedMissingTags, showOnlyResourcesWithoutTags]);

  const handleMissingTagSelection = (tagKey: string) => {
    setSelectedMissingTags(prev =>
      prev.includes(tagKey)
        ? prev.filter(tag => tag !== tagKey)
        : [...prev, tagKey]
    );
  };

  const columns: TableColumnDefinition<Resource>[] = [
    createTableColumn<Resource>({
      columnId: 'select',
      renderHeaderCell: () => (
        <Checkbox
          checked={selectedResourcesCount > 0}
          onChange={(_, data) => handleSelectAll(!!data.checked)}
        />
      ),
      renderCell: (item) => (
        <Checkbox
          checked={!!item.selected}
          onChange={(_, data) => handleResourceSelection(item.id, !!data.checked)}
        />
      ),
    }),
    createTableColumn<Resource>({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Name',
      renderCell: (item) => <Text weight="semibold">{item.name}</Text>,
    }),
    createTableColumn<Resource>({
      columnId: 'type',
      compare: (a, b) => a.type.localeCompare(b.type),
      renderHeaderCell: () => 'Type',
      renderCell: (item) => <Text>{item.type}</Text>,
    }),
    createTableColumn<Resource>({
      columnId: 'resourceGroup',
      compare: (a, b) => a.resourceGroup.localeCompare(b.resourceGroup),
      renderHeaderCell: () => 'Resource Group',
      renderCell: (item) => <Text>{item.resourceGroup}</Text>,
    }),
    createTableColumn<Resource>({
      columnId: 'subscription',
      compare: (a, b) => a.subscription.localeCompare(b.subscription),
      renderHeaderCell: () => 'Subscription',
      renderCell: (item) => <Text>{item.subscription}</Text>,
    }),
    createTableColumn<Resource>({
      columnId: 'location',
      compare: (a, b) => a.location.localeCompare(b.location),
      renderHeaderCell: () => 'Location',
      renderCell: (item) => <Text>{item.location}</Text>,
    }),
    createTableColumn<Resource>({
      columnId: 'tags',
      renderHeaderCell: () => 'Tags',
      renderCell: (item) => (
        <div className={styles.tagsCell}>
          {Object.entries(item.tags).map(([key, value]) => (
            <Badge
              key={key}
              className={styles.tagBadge}
              size="small"
              appearance="tint"
            >
              {key}: {value}
            </Badge>
          ))}
        </div>
      ),
    }),
    createTableColumn<Resource>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (_) => (
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="transparent"
              icon={<MoreVerticalRegular />}
              className={styles.actionButton}
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<EditRegular />}>
                Edit Tags
              </MenuItem>
              <MenuItem icon={<TagRegular />}>
                View in Portal
              </MenuItem>
              <MenuItem icon={<DeleteRegular />}>
                Remove Tags
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      ),
    }),
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Resources</Text>
        <Button appearance="primary" icon={<TagRegular />}>
          Bulk Tag Resources
        </Button>
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.filters}>
        <Input
          className={styles.searchInput}
          placeholder="Search resources..."
          contentBefore={<SearchRegular />}
          value={searchTerm}
          onChange={(_, data) => setSearchTerm(data.value)}
        />

        <Dropdown
          className={styles.dropdown}
          placeholder="Subscription"
          value={selectedSubscription}
          onOptionSelect={(_, data) => setSelectedSubscription(data.optionValue || '')}
        >
          <Option value="">All Subscriptions</Option>
          {subscriptions.map(sub => (
            <Option key={sub.subscriptionId} value={sub.subscriptionId}>
              {sub.displayName}
            </Option>
          ))}
        </Dropdown>

        <Dropdown
          className={styles.dropdown}
          placeholder="Type"
          value={selectedType}
          onOptionSelect={(_, data) => setSelectedType(data.optionValue || '')}
        >
          <Option value="">All Types</Option>
          <Option value="Microsoft.Web/sites">Web Apps</Option>
          <Option value="Microsoft.Storage/storageAccounts">Storage Accounts</Option>
          <Option value="Microsoft.Compute/virtualMachines">Virtual Machines</Option>
        </Dropdown>

        <Checkbox
          label="Show only resources without any tags"
          checked={showOnlyResourcesWithoutTags}
          onChange={(_, data) => setShowOnlyResourcesWithoutTags(!!data.checked)}
        />
      </div>

      {/* Missing Tags Filter Section */}
      <div className={styles.filters}>
        <Text weight="semibold">Filter by Missing Tags:</Text>
        {allTags.map(tag => (
          <Checkbox
            key={tag.key}
            label={`Missing "${tag.key}" tag`}
            checked={selectedMissingTags.includes(tag.key)}
            onChange={() => handleMissingTagSelection(tag.key)}
          />
        ))}
        {selectedMissingTags.length > 0 && (
          <Button
            appearance="subtle"
            size="small"
            onClick={() => setSelectedMissingTags([])}
          >
            Clear Missing Tag Filters
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {(selectedMissingTags.length > 0 || showOnlyResourcesWithoutTags) && (
        <MessageBar intent="info">
          <MessageBarBody>
            <MessageBarTitle>Active Filters</MessageBarTitle>
            {showOnlyResourcesWithoutTags && <Text>Showing only resources without any tags. </Text>}
            {selectedMissingTags.length > 0 && (
              <Text>Showing resources missing tags: {selectedMissingTags.join(', ')}</Text>
            )}
          </MessageBarBody>
        </MessageBar>
      )}

      {selectedResourcesCount > 0 && (
        <div className={styles.bulkActions}>
          <Text>{selectedResourcesCount} resources selected</Text>
          <Button appearance="primary" size="small">
            Bulk Edit Tags
          </Button>
          <Button appearance="secondary" size="small">
            Export Selected
          </Button>
          <Button appearance="secondary" size="small">
            Clear Selection
          </Button>
        </div>
      )}

      <div className={styles.dataGridContainer}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <Spinner label="Loading resources..." />
          </div>
        ) : resources.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '200px', gap: '12px' }}>
            <InfoRegular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3 }} />
            <Text>No resources found matching the current filters.</Text>
            <Text size={200}>Try adjusting your filter criteria or clearing some filters.</Text>
          </div>
        ) : (
          <DataGrid
            items={resources}
            columns={columns}
            sortable
            getRowId={(item) => item.id}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<Resource>>
              {({ item, rowId }) => (
                <DataGridRow<Resource> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        )}
      </div>
    </div>
  );
};