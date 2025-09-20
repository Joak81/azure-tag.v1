import { ResourceManagementClient } from '@azure/arm-resources';
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';
import { winstonLogger } from '../middleware/logger';
import { APIError } from '../middleware/errorHandler';

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

export class AzureService {
  private credentials: DefaultAzureCredential | ClientSecretCredential;

  constructor() {
    // Use service principal credentials if available, otherwise use default credential chain
    if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_TENANT_ID) {
      this.credentials = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_CLIENT_ID,
        process.env.AZURE_CLIENT_SECRET
      );
    } else {
      this.credentials = new DefaultAzureCredential();
    }
  }

  /**
   * Get all subscriptions accessible to the user
   */
  async getSubscriptions(userToken?: string): Promise<AzureSubscription[]> {
    try {
      // If user token is provided, use it to get subscriptions accessible to the user
      if (userToken) {
        const response = await fetch('https://management.azure.com/subscriptions?api-version=2020-01-01', {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new APIError('Failed to fetch subscriptions', response.status);
        }

        const data: any = await response.json();
        return data.value.map((sub: any) => ({
          subscriptionId: sub.subscriptionId,
          displayName: sub.displayName,
          state: sub.state,
          tenantId: sub.tenantId,
        }));
      }

      // Fallback to service principal (limited subscriptions)
      const resourceClient = new ResourceManagementClient(this.credentials, 'placeholder');
      // This would require listing all subscriptions the service principal has access to
      // For now, return empty array if no user token
      return [];
    } catch (error) {
      winstonLogger.error('Error fetching subscriptions', { error: error.message });
      throw new APIError('Failed to fetch subscriptions', 500);
    }
  }

  /**
   * Get all resources in a subscription
   */
  async getResources(subscriptionId: string, userToken?: string, filters?: {
    resourceGroupName?: string;
    resourceType?: string;
    tagName?: string;
    tagValue?: string;
  }): Promise<AzureResource[]> {
    try {
      let url = `https://management.azure.com/subscriptions/${subscriptionId}/resources?api-version=2021-04-01`;

      // Apply filters
      const queryParams = new URLSearchParams();
      if (filters?.resourceType) {
        queryParams.append('$filter', `resourceType eq '${filters.resourceType}'`);
      }
      if (filters?.resourceGroupName) {
        url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${filters.resourceGroupName}/resources?api-version=2021-04-01`;
      }

      if (queryParams.toString()) {
        url += '&' + queryParams.toString();
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new APIError('Failed to fetch resources', response.status);
      }

      const data: any = await response.json();

      let resources: AzureResource[] = data.value.map((resource: any) => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        kind: resource.kind,
        location: resource.location,
        resourceGroup: this.extractResourceGroupFromId(resource.id),
        subscriptionId: subscriptionId,
        tags: resource.tags || {},
        properties: resource.properties,
      }));

      // Apply tag filters client-side
      if (filters?.tagName) {
        resources = resources.filter(resource =>
          resource.tags && Object.keys(resource.tags).includes(filters.tagName!)
        );
      }

      if (filters?.tagValue && filters?.tagName) {
        resources = resources.filter(resource =>
          resource.tags && resource.tags[filters.tagName!] === filters.tagValue
        );
      }

      return resources;
    } catch (error) {
      winstonLogger.error('Error fetching resources', { subscriptionId, error: error.message });
      throw new APIError('Failed to fetch resources', 500);
    }
  }

  /**
   * Get resource by ID
   */
  async getResource(resourceId: string, userToken?: string): Promise<AzureResource | null> {
    try {
      const url = `https://management.azure.com${resourceId}?api-version=2021-04-01`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new APIError('Failed to fetch resource', response.status);
      }

      const resource: any = await response.json();

      return {
        id: resource.id,
        name: resource.name,
        type: resource.type,
        kind: resource.kind,
        location: resource.location,
        resourceGroup: this.extractResourceGroupFromId(resource.id),
        subscriptionId: this.extractSubscriptionIdFromId(resource.id),
        tags: resource.tags || {},
        properties: resource.properties,
      };
    } catch (error) {
      winstonLogger.error('Error fetching resource', { resourceId, error: error.message });
      throw new APIError('Failed to fetch resource', 500);
    }
  }

  /**
   * Update tags on a resource
   */
  async updateResourceTags(
    resourceId: string,
    tags: Record<string, string>,
    userToken?: string,
    operation: 'replace' | 'merge' | 'delete' = 'merge'
  ): Promise<AzureResource> {
    try {
      const url = `https://management.azure.com${resourceId}?api-version=2021-04-01`;

      let tagsPayload = {};

      if (operation === 'replace') {
        tagsPayload = { tags };
      } else if (operation === 'merge') {
        // First get current resource to merge tags
        const currentResource = await this.getResource(resourceId, userToken);
        tagsPayload = {
          tags: {
            ...(currentResource?.tags || {}),
            ...tags,
          },
        };
      } else if (operation === 'delete') {
        // Get current resource and remove specified tags
        const currentResource = await this.getResource(resourceId, userToken);
        const currentTags = { ...(currentResource?.tags || {}) };
        Object.keys(tags).forEach(key => delete currentTags[key]);
        tagsPayload = { tags: currentTags };
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagsPayload),
      });

      if (!response.ok) {
        throw new APIError('Failed to update resource tags', response.status);
      }

      const updatedResource: any = await response.json();

      return {
        id: updatedResource.id,
        name: updatedResource.name,
        type: updatedResource.type,
        kind: updatedResource.kind,
        location: updatedResource.location,
        resourceGroup: this.extractResourceGroupFromId(updatedResource.id),
        subscriptionId: this.extractSubscriptionIdFromId(updatedResource.id),
        tags: updatedResource.tags || {},
        properties: updatedResource.properties,
      };
    } catch (error) {
      winstonLogger.error('Error updating resource tags', { resourceId, tags, error: error.message });
      throw new APIError('Failed to update resource tags', 500);
    }
  }

  /**
   * Bulk update tags on multiple resources
   */
  async bulkUpdateResourceTags(
    resourceIds: string[],
    tags: Record<string, string>,
    userToken?: string,
    operation: 'replace' | 'merge' | 'delete' = 'merge'
  ): Promise<{ successful: string[]; failed: Array<{ resourceId: string; error: string }> }> {
    const successful: string[] = [];
    const failed: Array<{ resourceId: string; error: string }> = [];

    // Process resources in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < resourceIds.length; i += batchSize) {
      const batch = resourceIds.slice(i, i + batchSize);

      const promises = batch.map(async (resourceId) => {
        try {
          await this.updateResourceTags(resourceId, tags, userToken, operation);
          successful.push(resourceId);
        } catch (error) {
          failed.push({
            resourceId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      await Promise.all(promises);

      // Add small delay between batches to respect rate limits
      if (i + batchSize < resourceIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { successful, failed };
  }

  /**
   * Get all resource groups in a subscription
   */
  async getResourceGroups(subscriptionId: string, userToken?: string): Promise<Array<{ name: string; location: string; tags?: Record<string, string> }>> {
    try {
      const url = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups?api-version=2021-04-01`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new APIError('Failed to fetch resource groups', response.status);
      }

      const data: any = await response.json();

      return data.value.map((rg: any) => ({
        name: rg.name,
        location: rg.location,
        tags: rg.tags || {},
      }));
    } catch (error) {
      winstonLogger.error('Error fetching resource groups', { subscriptionId, error: error.message });
      throw new APIError('Failed to fetch resource groups', 500);
    }
  }

  /**
   * Extract resource group name from Azure resource ID
   */
  private extractResourceGroupFromId(resourceId: string): string {
    const match = resourceId.match(/\/resourceGroups\/([^\/]+)/);
    return match ? match[1] : '';
  }

  /**
   * Extract subscription ID from Azure resource ID
   */
  private extractSubscriptionIdFromId(resourceId: string): string {
    const match = resourceId.match(/\/subscriptions\/([^\/]+)/);
    return match ? match[1] : '';
  }
}