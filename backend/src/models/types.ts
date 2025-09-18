// Common types used across the application

export interface AzureResource {
  id: string;
  name: string;
  type: string;
  kind?: string;
  location: string;
  resourceGroup: string;
  subscriptionId: string;
  tags?: Record<string, string>;
  properties?: any;
}

export interface AzureSubscription {
  subscriptionId: string;
  displayName: string;
  state: string;
  tenantId: string;
}

export interface TagTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: Record<string, string>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagPolicy {
  id: string;
  name: string;
  description: string;
  scope: 'global' | 'subscription' | 'resourceGroup';
  scopeId?: string;
  requiredTags: RequiredTag[];
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequiredTag {
  key: string;
  description: string;
  allowedValues?: string[];
  pattern?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  conditions: AlertCondition[];
  recipients: string[];
  scope: {
    subscriptions?: string[];
    resourceGroups?: string[];
  };
  lastTriggered?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertCondition {
  type: 'missing_tag' | 'invalid_tag_value' | 'resource_type' | 'cost_threshold';
  tagKey?: string;
  tagValue?: string;
  allowedValues?: string[];
  resourceType?: string;
  threshold?: number;
}

export interface ComplianceViolation {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  resourceGroup: string;
  subscriptionId: string;
  location: string;
  condition: AlertCondition;
  reason: string;
  tags: Record<string, string>;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  tenantId: string;
  roles?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp?: string;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface BulkOperationResult {
  successful: string[];
  failed: Array<{
    resourceId: string;
    error: string;
  }>;
}

export interface ComplianceReport {
  totalResources: number;
  compliantResources: number;
  nonCompliantResources: number;
  compliancePercentage: number;
  violations: ComplianceViolation[];
  complianceByPolicy: Array<{
    policyId: string;
    policyName: string;
    compliant: number;
    nonCompliant: number;
    percentage: number;
  }>;
}

export interface ResourceFilters {
  subscriptionId?: string;
  resourceGroupName?: string;
  resourceType?: string;
  location?: string;
  tagName?: string;
  tagValue?: string;
  hasTag?: string;
  missingTag?: string;
  query?: string;
}

export interface AppSettings {
  NODE_ENV: string;
  AZURE_CLIENT_ID: string;
  AZURE_TENANT_ID: string;
  AZURE_CLIENT_SECRET?: string;
  FRONTEND_URL: string;
  API_URL?: string;
  PORT?: number;
  LOG_LEVEL: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
}