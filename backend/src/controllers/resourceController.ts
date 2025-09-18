import { Router, Request, Response } from 'express';
import { asyncHandler, badRequest, notFound } from '../middleware/errorHandler';
import { AzureService } from '../services/azureService';
import Joi from 'joi';

const router = Router();
const azureService = new AzureService();

// Validation schemas
const getResourcesSchema = Joi.object({
  subscriptionId: Joi.string().required(),
  resourceGroupName: Joi.string().optional(),
  resourceType: Joi.string().optional(),
  tagName: Joi.string().optional(),
  tagValue: Joi.string().optional(),
  limit: Joi.number().min(1).max(1000).default(100),
  offset: Joi.number().min(0).default(0),
});

const updateTagsSchema = Joi.object({
  tags: Joi.object().pattern(Joi.string(), Joi.string()).required(),
  operation: Joi.string().valid('replace', 'merge', 'delete').default('merge'),
});

const bulkUpdateSchema = Joi.object({
  resourceIds: Joi.array().items(Joi.string()).min(1).max(1000).required(),
  tags: Joi.object().pattern(Joi.string(), Joi.string()).required(),
  operation: Joi.string().valid('replace', 'merge', 'delete').default('merge'),
});

/**
 * GET /api/resources
 * Get resources across all accessible subscriptions or a specific subscription
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = getResourcesSchema.validate(req.query);
  if (error) {
    throw badRequest(error.details[0].message);
  }

  const { subscriptionId, resourceGroupName, resourceType, tagName, tagValue, limit, offset } = value;
  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  const filters = {
    resourceGroupName,
    resourceType,
    tagName,
    tagValue,
  };

  const resources = await azureService.getResources(subscriptionId, userToken, filters);

  // Apply pagination
  const paginatedResources = resources.slice(offset, offset + limit);

  res.json({
    success: true,
    data: {
      resources: paginatedResources,
      pagination: {
        total: resources.length,
        limit,
        offset,
        hasMore: offset + limit < resources.length,
      },
    },
  });
}));

/**
 * GET /api/resources/subscriptions
 * Get all accessible subscriptions
 */
router.get('/subscriptions', asyncHandler(async (req: Request, res: Response) => {
  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  const subscriptions = await azureService.getSubscriptions(userToken);

  res.json({
    success: true,
    data: { subscriptions },
  });
}));

/**
 * GET /api/resources/subscriptions/:subscriptionId/resourceGroups
 * Get resource groups in a subscription
 */
router.get('/subscriptions/:subscriptionId/resourceGroups', asyncHandler(async (req: Request, res: Response) => {
  const { subscriptionId } = req.params;
  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  const resourceGroups = await azureService.getResourceGroups(subscriptionId, userToken);

  res.json({
    success: true,
    data: { resourceGroups },
  });
}));

/**
 * GET /api/resources/:resourceId
 * Get a specific resource by ID
 */
router.get('/:resourceId(*)', asyncHandler(async (req: Request, res: Response) => {
  const resourceId = '/' + req.params.resourceId;
  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  const resource = await azureService.getResource(resourceId, userToken);

  if (!resource) {
    throw notFound('Resource');
  }

  res.json({
    success: true,
    data: { resource },
  });
}));

/**
 * GET /api/resources/:resourceId/tags
 * Get tags for a specific resource
 */
router.get('/:resourceId(*)/tags', asyncHandler(async (req: Request, res: Response) => {
  const resourceId = '/' + req.params.resourceId;
  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  const resource = await azureService.getResource(resourceId, userToken);

  if (!resource) {
    throw notFound('Resource');
  }

  res.json({
    success: true,
    data: {
      resourceId: resource.id,
      tags: resource.tags || {},
    },
  });
}));

/**
 * PATCH /api/resources/:resourceId/tags
 * Update tags for a specific resource
 */
router.patch('/:resourceId(*)/tags', asyncHandler(async (req: Request, res: Response) => {
  const resourceId = '/' + req.params.resourceId;
  const { error, value } = updateTagsSchema.validate(req.body);

  if (error) {
    throw badRequest(error.details[0].message);
  }

  const { tags, operation } = value;
  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  const updatedResource = await azureService.updateResourceTags(
    resourceId,
    tags,
    userToken,
    operation
  );

  res.json({
    success: true,
    data: {
      resource: updatedResource,
      message: `Tags ${operation}d successfully`,
    },
  });
}));

/**
 * POST /api/resources/bulk-update
 * Bulk update tags for multiple resources
 */
router.post('/bulk-update', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = bulkUpdateSchema.validate(req.body);

  if (error) {
    throw badRequest(error.details[0].message);
  }

  const { resourceIds, tags, operation } = value;
  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  const result = await azureService.bulkUpdateResourceTags(
    resourceIds,
    tags,
    userToken,
    operation
  );

  res.json({
    success: true,
    data: {
      successful: result.successful,
      failed: result.failed,
      summary: {
        totalRequested: resourceIds.length,
        successful: result.successful.length,
        failed: result.failed.length,
      },
      message: `Bulk ${operation} operation completed`,
    },
  });
}));

/**
 * GET /api/resources/search
 * Search resources by various criteria
 */
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const {
    query,
    subscriptionId,
    resourceType,
    location,
    hasTag,
    missingTag,
    missingTags, // Support for multiple missing tags
    tagKey,
    tagValue,
    limit = 100,
    offset = 0,
  } = req.query;

  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  // For now, we'll implement a basic search
  // In a production environment, you might use Azure Resource Graph for advanced queries

  const allResources: any[] = [];

  if (subscriptionId) {
    // Search in specific subscription
    const resources = await azureService.getResources(subscriptionId as string, userToken);
    allResources.push(...resources);
  } else {
    // Search across all accessible subscriptions
    const subscriptions = await azureService.getSubscriptions(userToken);
    for (const subscription of subscriptions) {
      try {
        const resources = await azureService.getResources(subscription.subscriptionId, userToken);
        allResources.push(...resources);
      } catch (error) {
        // Continue with other subscriptions if one fails
        console.warn(`Failed to fetch resources from subscription ${subscription.subscriptionId}`);
      }
    }
  }

  // Apply filters
  let filteredResources = allResources;

  if (query) {
    filteredResources = filteredResources.filter(resource =>
      resource.name.toLowerCase().includes((query as string).toLowerCase()) ||
      resource.type.toLowerCase().includes((query as string).toLowerCase())
    );
  }

  if (resourceType) {
    filteredResources = filteredResources.filter(resource =>
      resource.type === resourceType
    );
  }

  if (location) {
    filteredResources = filteredResources.filter(resource =>
      resource.location === location
    );
  }

  if (hasTag) {
    filteredResources = filteredResources.filter(resource =>
      resource.tags && Object.keys(resource.tags).includes(hasTag as string)
    );
  }

  if (missingTag) {
    filteredResources = filteredResources.filter(resource =>
      !resource.tags || !Object.keys(resource.tags).includes(missingTag as string)
    );
  }

  // Support for multiple missing tags (comma-separated)
  if (missingTags) {
    const tagsArray = (missingTags as string).split(',').map(tag => tag.trim());
    filteredResources = filteredResources.filter(resource => {
      if (!resource.tags) return true; // No tags means missing all tags
      return tagsArray.some(tag => !Object.keys(resource.tags).includes(tag));
    });
  }

  if (tagKey && tagValue) {
    filteredResources = filteredResources.filter(resource =>
      resource.tags && resource.tags[tagKey as string] === tagValue
    );
  }

  // Apply pagination
  const startIndex = parseInt(offset as string) || 0;
  const pageSize = parseInt(limit as string) || 100;
  const paginatedResources = filteredResources.slice(startIndex, startIndex + pageSize);

  res.json({
    success: true,
    data: {
      resources: paginatedResources,
      pagination: {
        total: filteredResources.length,
        limit: pageSize,
        offset: startIndex,
        hasMore: startIndex + pageSize < filteredResources.length,
      },
    },
  });
}));

/**
 * GET /api/resources/tags/all
 * Get all unique tags across accessible resources
 */
router.get('/tags/all', asyncHandler(async (req: Request, res: Response) => {
  const { subscriptionId } = req.query;
  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  const allResources: any[] = [];

  if (subscriptionId) {
    // Get tags from specific subscription
    const resources = await azureService.getResources(subscriptionId as string, userToken);
    allResources.push(...resources);
  } else {
    // Get tags across all accessible subscriptions
    const subscriptions = await azureService.getSubscriptions(userToken);
    for (const subscription of subscriptions) {
      try {
        const resources = await azureService.getResources(subscription.subscriptionId, userToken);
        allResources.push(...resources);
      } catch (error) {
        // Continue with other subscriptions if one fails
        console.warn(`Failed to fetch resources from subscription ${subscription.subscriptionId}`);
      }
    }
  }

  // Collect all unique tag keys and values
  const tagKeys = new Set<string>();
  const tagValues = new Map<string, Set<string>>();

  allResources.forEach(resource => {
    if (resource.tags) {
      Object.entries(resource.tags).forEach(([key, value]) => {
        tagKeys.add(key);
        if (!tagValues.has(key)) {
          tagValues.set(key, new Set());
        }
        tagValues.get(key)!.add(value as string);
      });
    }
  });

  // Convert to arrays for JSON response
  const tagsData = Array.from(tagKeys).map(key => ({
    key,
    values: Array.from(tagValues.get(key) || []),
  }));

  res.json({
    success: true,
    data: {
      tags: tagsData,
      summary: {
        totalUniqueKeys: tagKeys.size,
        totalResources: allResources.length,
        resourcesWithTags: allResources.filter(r => r.tags && Object.keys(r.tags).length > 0).length,
        resourcesWithoutTags: allResources.filter(r => !r.tags || Object.keys(r.tags).length === 0).length,
      },
    },
  });
}));

export default router;