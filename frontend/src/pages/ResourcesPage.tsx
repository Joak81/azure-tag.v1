import React, { useState } from 'react';
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
} from '@fluentui/react-components';
import {
  SearchRegular,
  FilterRegular,
  TagRegular,
  MoreVerticalRegular,
  EditRegular,
  DeleteRegular,
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
  location: string;
  tags: Record<string, string>;
  selected?: boolean;
}

// Mock data
const mockResources: Resource[] = [
  {
    id: '1',
    name: 'webapp-prod-001',
    type: 'Microsoft.Web/sites',
    resourceGroup: 'rg-prod-web',
    subscription: 'Production Subscription',
    location: 'West Europe',
    tags: { Environment: 'Production', Owner: 'team-web@company.com', CostCenter: 'CC-001' },
  },
  {
    id: '2',
    name: 'storage-logs-001',
    type: 'Microsoft.Storage/storageAccounts',
    resourceGroup: 'rg-prod-storage',
    subscription: 'Production Subscription',
    location: 'West Europe',
    tags: { Environment: 'Production', Project: 'Logging' },
  },
  {
    id: '3',
    name: 'vm-dev-web-001',
    type: 'Microsoft.Compute/virtualMachines',
    resourceGroup: 'rg-dev-compute',
    subscription: 'Development Subscription',
    location: 'North Europe',
    tags: { Environment: 'Development' },
  },
];

export const ResourcesPage: React.FC = () => {
  const styles = useStyles();
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState<string>('');
  const [selectedResourceGroup, setSelectedResourceGroup] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  const selectedResourcesCount = resources.filter(r => r.selected).length;

  const handleResourceSelection = (resourceId: string, selected: boolean) => {
    setResources(prev =>
      prev.map(r => r.id === resourceId ? { ...r, selected } : r)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setResources(prev => prev.map(r => ({ ...r, selected })));
  };

  const columns: TableColumnDefinition<Resource>[] = [
    createTableColumn<Resource>({
      columnId: 'select',
      renderHeaderCell: () => (
        <Checkbox
          checked={selectedResourcesCount > 0}
          indeterminate={selectedResourcesCount > 0 && selectedResourcesCount < resources.length}
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
      renderCell: (item) => (
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
          <Option value="production">Production Subscription</Option>
          <Option value="development">Development Subscription</Option>
        </Dropdown>

        <Dropdown
          className={styles.dropdown}
          placeholder="Resource Group"
          value={selectedResourceGroup}
          onOptionSelect={(_, data) => setSelectedResourceGroup(data.optionValue || '')}
        >
          <Option value="">All Resource Groups</Option>
          <Option value="rg-prod-web">rg-prod-web</Option>
          <Option value="rg-prod-storage">rg-prod-storage</Option>
          <Option value="rg-dev-compute">rg-dev-compute</Option>
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

        <Button appearance="secondary" icon={<FilterRegular />}>
          Advanced Filters
        </Button>
      </div>

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
      </div>
    </div>
  );
};