// API service for Azure Tag Manager

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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // Use relative URLs so they work in both dev and production
    this.baseUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:3001/api'
      : '/api';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  // Get all subscriptions
  async getSubscriptions(): Promise<ApiResponse<AzureSubscription[]>> {
    return this.makeRequest<AzureSubscription[]>('/subscriptions');
  }

  // Get resources for a subscription
  async getResources(
    subscriptionId: string,
    filters?: {
      resourceGroupName?: string;
      resourceType?: string;
      tagName?: string;
      tagValue?: string;
    }
  ): Promise<ApiResponse<AzureResource[]>> {
    const queryParams = new URLSearchParams();
    if (filters?.resourceGroupName) queryParams.append('resourceGroupName', filters.resourceGroupName);
    if (filters?.resourceType) queryParams.append('resourceType', filters.resourceType);
    if (filters?.tagName) queryParams.append('tagName', filters.tagName);
    if (filters?.tagValue) queryParams.append('tagValue', filters.tagValue);

    const queryString = queryParams.toString();
    const endpoint = `/subscriptions/${subscriptionId}/resources${queryString ? '?' + queryString : ''}`;

    return this.makeRequest<AzureResource[]>(endpoint);
  }

  // Get resource groups for a subscription
  async getResourceGroups(subscriptionId: string): Promise<ApiResponse<Array<{ name: string; location: string; tags?: Record<string, string> }>>> {
    return this.makeRequest(`/subscriptions/${subscriptionId}/resourcegroups`);
  }

  // Update resource tags
  async updateResourceTags(
    resourceId: string,
    tags: Record<string, string>,
    operation: 'replace' | 'merge' | 'delete' = 'merge'
  ): Promise<ApiResponse<AzureResource>> {
    return this.makeRequest<AzureResource>('/resources/tags', {
      method: 'PUT',
      body: JSON.stringify({
        resourceId,
        tags,
        operation,
      }),
    });
  }

  // Bulk update resource tags
  async bulkUpdateResourceTags(
    resourceIds: string[],
    tags: Record<string, string>,
    operation: 'replace' | 'merge' | 'delete' = 'merge'
  ): Promise<ApiResponse<{ successful: string[]; failed: Array<{ resourceId: string; error: string }> }>> {
    return this.makeRequest('/resources/bulk-tags', {
      method: 'PUT',
      body: JSON.stringify({
        resourceIds,
        tags,
        operation,
      }),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string; version: string; environment: string; port: string }>> {
    return this.makeRequest('/health');
  }

  // Get current user info
  async getCurrentUser(): Promise<ApiResponse<{ id: string; name: string; email: string; tenantId: string; roles: string[] }>> {
    return this.makeRequest('/auth/user');
  }
}

export const apiService = new ApiService();