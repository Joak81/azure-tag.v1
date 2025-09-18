// Application constants

export const APP_NAME = 'Azure Tag Manager';
export const APP_VERSION = '1.0.0';

export const ROUTES = {
  HOME: '/',
  RESOURCES: '/resources',
  TAGS: '/tags',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    USER: '/auth/user',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  RESOURCES: {
    BASE: '/resources',
    SUBSCRIPTIONS: '/resources/subscriptions',
    BULK_UPDATE: '/resources/bulk-update',
    SEARCH: '/resources/search',
  },
  TAGS: {
    TEMPLATES: '/tags/templates',
    POLICIES: '/tags/policies',
    COMPLIANCE: '/tags/compliance',
    VALIDATE: '/tags/validate',
  },
  REPORTS: {
    COMPLIANCE: '/reports/compliance',
    COSTS: '/reports/costs',
    RESOURCES: '/reports/resources',
    EXPORT: '/reports/export',
  },
  ALERTS: {
    BASE: '/alerts',
    CHECK_ALL: '/alerts/check-all',
  },
} as const;

export const AZURE_RESOURCE_TYPES = {
  VIRTUAL_MACHINES: 'Microsoft.Compute/virtualMachines',
  STORAGE_ACCOUNTS: 'Microsoft.Storage/storageAccounts',
  WEB_APPS: 'Microsoft.Web/sites',
  SQL_DATABASES: 'Microsoft.Sql/servers/databases',
  SQL_SERVERS: 'Microsoft.Sql/servers',
  KEY_VAULTS: 'Microsoft.KeyVault/vaults',
  NETWORK_INTERFACES: 'Microsoft.Network/networkInterfaces',
  PUBLIC_IP_ADDRESSES: 'Microsoft.Network/publicIPAddresses',
  VIRTUAL_NETWORKS: 'Microsoft.Network/virtualNetworks',
  LOAD_BALANCERS: 'Microsoft.Network/loadBalancers',
  APPLICATION_GATEWAYS: 'Microsoft.Network/applicationGateways',
  REDIS_CACHE: 'Microsoft.Cache/Redis',
  SERVICE_BUS: 'Microsoft.ServiceBus/namespaces',
  EVENT_HUBS: 'Microsoft.EventHub/namespaces',
  COSMOS_DB: 'Microsoft.DocumentDB/databaseAccounts',
  FUNCTION_APPS: 'Microsoft.Web/sites',
  APP_SERVICE_PLANS: 'Microsoft.Web/serverfarms',
} as const;

export const AZURE_LOCATIONS = [
  'East US',
  'East US 2',
  'West US',
  'West US 2',
  'West US 3',
  'Central US',
  'North Central US',
  'South Central US',
  'West Central US',
  'Canada Central',
  'Canada East',
  'Brazil South',
  'North Europe',
  'West Europe',
  'UK South',
  'UK West',
  'France Central',
  'France South',
  'Germany West Central',
  'Norway East',
  'Switzerland North',
  'Sweden Central',
  'East Asia',
  'Southeast Asia',
  'Japan East',
  'Japan West',
  'Australia East',
  'Australia Southeast',
  'Central India',
  'South India',
  'West India',
  'Korea Central',
  'Korea South',
] as const;

export const TAG_POLICIES = {
  REQUIRED_TAGS: [
    'Environment',
    'Owner',
    'CostCenter',
    'Project',
    'Application',
  ],
  ENVIRONMENT_VALUES: [
    'Development',
    'Staging',
    'Production',
    'Test',
  ],
  CRITICALITY_VALUES: [
    'Low',
    'Medium',
    'High',
    'Critical',
  ],
  DATA_CLASSIFICATION_VALUES: [
    'Public',
    'Internal',
    'Confidential',
    'Restricted',
  ],
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000,
  BULK_OPERATION_LIMIT: 1000,
} as const;

export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  BULK_OPERATION: 300000, // 5 minutes
  TOKEN_REFRESH: 5000, // 5 seconds
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'azure_tag_manager_token',
  USER_PREFERENCES: 'azure_tag_manager_preferences',
  SELECTED_SUBSCRIPTION: 'azure_tag_manager_selected_subscription',
} as const;

export const COLORS = {
  PRIMARY: '#0078D4',
  SUCCESS: '#107C10',
  WARNING: '#FFB900',
  ERROR: '#D13438',
  NEUTRAL: '#605E5C',

  // Chart colors
  CHART_COLORS: [
    '#0078D4', // Azure Blue
    '#00BCF2', // Light Blue
    '#40E0D0', // Turquoise
    '#1BA1E2', // Sky Blue
    '#0099BC', // Teal
    '#2E8B57', // Sea Green
    '#FFB900', // Yellow
    '#FF8C00', // Orange
    '#DC143C', // Crimson
    '#9932CC', // Purple
  ],
} as const;

export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  TAG_KEY: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
  COST_CENTER: /^CC-[A-Z0-9]{3,6}$/,
  AZURE_RESOURCE_ID: /^\/subscriptions\/[a-f0-9-]{36}\/resourceGroups\/[^/]+\/providers\/[^/]+\/[^/]+\/[^/]+$/,
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access to this resource is forbidden.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An internal server error occurred. Please try again later.',
  TIMEOUT_ERROR: 'The request timed out. Please try again.',
  BULK_OPERATION_LIMIT: `Bulk operations are limited to ${PAGINATION.BULK_OPERATION_LIMIT} resources.`,
  MISSING_REQUIRED_TAGS: 'Some required tags are missing.',
  INVALID_TAG_FORMAT: 'Tag key must start with a letter and contain only letters, numbers, underscores, and hyphens.',
} as const;

export const SUCCESS_MESSAGES = {
  TAGS_UPDATED: 'Tags updated successfully',
  TEMPLATE_CREATED: 'Tag template created successfully',
  TEMPLATE_APPLIED: 'Tag template applied successfully',
  POLICY_CREATED: 'Tag policy created successfully',
  ALERT_CREATED: 'Alert rule created successfully',
  BULK_OPERATION_COMPLETED: 'Bulk operation completed',
  EXPORT_GENERATED: 'Export generated successfully',
} as const;