import { Router, Request, Response } from 'express';
import { asyncHandler, badRequest } from '../middleware/errorHandler';
import { AzureService } from '../services/azureService';
import Joi from 'joi';

const router = Router();
const azureService = new AzureService();

// In-memory storage for tag templates and policies (in production, use a database)
let tagTemplates: Array<{
  id: string;
  name: string;
  description: string;
  category: string;
  tags: Record<string, string>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}> = [
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
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let tagPolicies: Array<{
  id: string;
  name: string;
  description: string;
  scope: 'global' | 'subscription' | 'resourceGroup';
  scopeId?: string;
  requiredTags: Array<{
    key: string;
    description: string;
    allowedValues?: string[];
    pattern?: string;
  }>;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: '1',
    name: 'Global Required Tags',
    description: 'Tags required for all resources',
    scope: 'global',
    requiredTags: [
      {
        key: 'Environment',
        description: 'Environment classification',
        allowedValues: ['Development', 'Staging', 'Production'],
      },
      {
        key: 'Owner',
        description: 'Resource owner email',
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      },
    ],
    enabled: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Validation schemas
const createTemplateSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(500),
  category: Joi.string().required().min(1).max(50),
  tags: Joi.object().pattern(Joi.string(), Joi.string()).required(),
});

const updateTemplateSchema = Joi.object({
  name: Joi.string().optional().min(1).max(100),
  description: Joi.string().optional().max(500),
  category: Joi.string().optional().min(1).max(50),
  tags: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
});

const createPolicySchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(500),
  scope: Joi.string().valid('global', 'subscription', 'resourceGroup').required(),
  scopeId: Joi.string().optional(),
  requiredTags: Joi.array().items(Joi.object({
    key: Joi.string().required(),
    description: Joi.string().required(),
    allowedValues: Joi.array().items(Joi.string()).optional(),
    pattern: Joi.string().optional(),
  })).required(),
  enabled: Joi.boolean().default(true),
});

const applyTemplateSchema = Joi.object({
  templateId: Joi.string().required(),
  resourceIds: Joi.array().items(Joi.string()).min(1).max(1000).required(),
  operation: Joi.string().valid('replace', 'merge').default('merge'),
});

/**
 * GET /api/tags/templates
 * Get all tag templates
 */
router.get('/templates', asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query;

  let filteredTemplates = tagTemplates;

  if (category) {
    filteredTemplates = tagTemplates.filter(template =>
      template.category.toLowerCase() === (category as string).toLowerCase()
    );
  }

  res.json({
    success: true,
    data: { templates: filteredTemplates },
  });
}));

/**
 * POST /api/tags/templates
 * Create a new tag template
 */
router.post('/templates', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createTemplateSchema.validate(req.body);
  if (error) {
    throw badRequest(error.details[0].message);
  }

  const { name, description, category, tags } = value;

  const newTemplate = {
    id: Date.now().toString(),
    name,
    description: description || '',
    category,
    tags,
    createdBy: req.user?.email || 'unknown',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tagTemplates.push(newTemplate);

  res.status(201).json({
    success: true,
    data: { template: newTemplate },
    message: 'Template created successfully',
  });
}));

/**
 * GET /api/tags/templates/:templateId
 * Get a specific tag template
 */
router.get('/templates/:templateId', asyncHandler(async (req: Request, res: Response) => {
  const { templateId } = req.params;

  const template = tagTemplates.find(t => t.id === templateId);

  if (!template) {
    throw badRequest('Template not found');
  }

  res.json({
    success: true,
    data: { template },
  });
}));

/**
 * PUT /api/tags/templates/:templateId
 * Update a tag template
 */
router.put('/templates/:templateId', asyncHandler(async (req: Request, res: Response) => {
  const { templateId } = req.params;
  const { error, value } = updateTemplateSchema.validate(req.body);

  if (error) {
    throw badRequest(error.details[0].message);
  }

  const templateIndex = tagTemplates.findIndex(t => t.id === templateId);

  if (templateIndex === -1) {
    throw badRequest('Template not found');
  }

  tagTemplates[templateIndex] = {
    ...tagTemplates[templateIndex],
    ...value,
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: { template: tagTemplates[templateIndex] },
    message: 'Template updated successfully',
  });
}));

/**
 * DELETE /api/tags/templates/:templateId
 * Delete a tag template
 */
router.delete('/templates/:templateId', asyncHandler(async (req: Request, res: Response) => {
  const { templateId } = req.params;

  const templateIndex = tagTemplates.findIndex(t => t.id === templateId);

  if (templateIndex === -1) {
    throw badRequest('Template not found');
  }

  tagTemplates.splice(templateIndex, 1);

  res.json({
    success: true,
    message: 'Template deleted successfully',
  });
}));

/**
 * POST /api/tags/templates/:templateId/apply
 * Apply a tag template to resources
 */
router.post('/templates/:templateId/apply', asyncHandler(async (req: Request, res: Response) => {
  const { templateId } = req.params;
  const { error, value } = applyTemplateSchema.validate({ ...req.body, templateId });

  if (error) {
    throw badRequest(error.details[0].message);
  }

  const { resourceIds, operation } = value;
  const template = tagTemplates.find(t => t.id === templateId);

  if (!template) {
    throw badRequest('Template not found');
  }

  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  const result = await azureService.bulkUpdateResourceTags(
    resourceIds,
    template.tags,
    userToken,
    operation
  );

  res.json({
    success: true,
    data: {
      template: template.name,
      successful: result.successful,
      failed: result.failed,
      summary: {
        totalRequested: resourceIds.length,
        successful: result.successful.length,
        failed: result.failed.length,
      },
    },
    message: `Template "${template.name}" applied successfully`,
  });
}));

/**
 * GET /api/tags/policies
 * Get all tag policies
 */
router.get('/policies', asyncHandler(async (req: Request, res: Response) => {
  const { scope, enabled } = req.query;

  let filteredPolicies = tagPolicies;

  if (scope) {
    filteredPolicies = filteredPolicies.filter(policy =>
      policy.scope === scope
    );
  }

  if (enabled !== undefined) {
    filteredPolicies = filteredPolicies.filter(policy =>
      policy.enabled === (enabled === 'true')
    );
  }

  res.json({
    success: true,
    data: { policies: filteredPolicies },
  });
}));

/**
 * POST /api/tags/policies
 * Create a new tag policy
 */
router.post('/policies', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createPolicySchema.validate(req.body);
  if (error) {
    throw badRequest(error.details[0].message);
  }

  const newPolicy = {
    ...value,
    id: Date.now().toString(),
    createdBy: req.user?.email || 'unknown',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tagPolicies.push(newPolicy);

  res.status(201).json({
    success: true,
    data: { policy: newPolicy },
    message: 'Policy created successfully',
  });
}));

/**
 * GET /api/tags/compliance
 * Get tag compliance report
 */
router.get('/compliance', asyncHandler(async (req: Request, res: Response) => {
  const { subscriptionId, policyId } = req.query;
  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  // Get all resources
  const allResources: any[] = [];

  if (subscriptionId) {
    const resources = await azureService.getResources(subscriptionId as string, userToken);
    allResources.push(...resources);
  } else {
    const subscriptions = await azureService.getSubscriptions(userToken);
    for (const subscription of subscriptions) {
      try {
        const resources = await azureService.getResources(subscription.subscriptionId, userToken);
        allResources.push(...resources);
      } catch (error) {
        console.warn(`Failed to fetch resources from subscription ${subscription.subscriptionId}`);
      }
    }
  }

  // Filter policies
  let applicablePolicies = tagPolicies.filter(p => p.enabled);
  if (policyId) {
    applicablePolicies = applicablePolicies.filter(p => p.id === policyId);
  }

  // Evaluate compliance
  const compliance = {
    totalResources: allResources.length,
    compliantResources: 0,
    nonCompliantResources: 0,
    compliancePercentage: 0,
    violations: [] as Array<{
      resourceId: string;
      resourceName: string;
      missingTags: string[];
      invalidTags: Array<{ key: string; value: string; reason: string }>;
    }>,
    complianceByPolicy: [] as Array<{
      policyId: string;
      policyName: string;
      compliant: number;
      nonCompliant: number;
      percentage: number;
    }>,
  };

  for (const resource of allResources) {
    let resourceCompliant = true;
    const violations = {
      resourceId: resource.id,
      resourceName: resource.name,
      missingTags: [] as string[],
      invalidTags: [] as Array<{ key: string; value: string; reason: string }>,
    };

    for (const policy of applicablePolicies) {
      for (const requiredTag of policy.requiredTags) {
        const tagValue = resource.tags?.[requiredTag.key];

        if (!tagValue) {
          violations.missingTags.push(requiredTag.key);
          resourceCompliant = false;
        } else {
          // Validate tag value
          if (requiredTag.allowedValues && !requiredTag.allowedValues.includes(tagValue)) {
            violations.invalidTags.push({
              key: requiredTag.key,
              value: tagValue,
              reason: `Value not in allowed list: ${requiredTag.allowedValues.join(', ')}`,
            });
            resourceCompliant = false;
          }

          if (requiredTag.pattern && !new RegExp(requiredTag.pattern).test(tagValue)) {
            violations.invalidTags.push({
              key: requiredTag.key,
              value: tagValue,
              reason: `Value does not match required pattern: ${requiredTag.pattern}`,
            });
            resourceCompliant = false;
          }
        }
      }
    }

    if (resourceCompliant) {
      compliance.compliantResources++;
    } else {
      compliance.nonCompliantResources++;
      compliance.violations.push(violations);
    }
  }

  compliance.compliancePercentage = Math.round(
    (compliance.compliantResources / compliance.totalResources) * 100
  );

  // Calculate compliance by policy
  for (const policy of applicablePolicies) {
    let policyCompliant = 0;
    let policyNonCompliant = 0;

    for (const resource of allResources) {
      let resourceCompliantWithPolicy = true;

      for (const requiredTag of policy.requiredTags) {
        const tagValue = resource.tags?.[requiredTag.key];

        if (!tagValue ||
            (requiredTag.allowedValues && !requiredTag.allowedValues.includes(tagValue)) ||
            (requiredTag.pattern && !new RegExp(requiredTag.pattern).test(tagValue))) {
          resourceCompliantWithPolicy = false;
          break;
        }
      }

      if (resourceCompliantWithPolicy) {
        policyCompliant++;
      } else {
        policyNonCompliant++;
      }
    }

    compliance.complianceByPolicy.push({
      policyId: policy.id,
      policyName: policy.name,
      compliant: policyCompliant,
      nonCompliant: policyNonCompliant,
      percentage: Math.round((policyCompliant / allResources.length) * 100),
    });
  }

  res.json({
    success: true,
    data: { compliance },
  });
}));

/**
 * POST /api/tags/validate
 * Validate tags against policies
 */
router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  const { tags, policyId } = req.body;

  if (!tags || typeof tags !== 'object') {
    throw badRequest('Tags object is required');
  }

  let applicablePolicies = tagPolicies.filter(p => p.enabled);
  if (policyId) {
    applicablePolicies = applicablePolicies.filter(p => p.id === policyId);
  }

  const validation = {
    valid: true,
    errors: [] as string[],
    warnings: [] as string[],
  };

  for (const policy of applicablePolicies) {
    for (const requiredTag of policy.requiredTags) {
      const tagValue = tags[requiredTag.key];

      if (!tagValue) {
        validation.errors.push(`Missing required tag: ${requiredTag.key}`);
        validation.valid = false;
      } else {
        if (requiredTag.allowedValues && !requiredTag.allowedValues.includes(tagValue)) {
          validation.errors.push(
            `Tag "${requiredTag.key}" has invalid value "${tagValue}". Allowed values: ${requiredTag.allowedValues.join(', ')}`
          );
          validation.valid = false;
        }

        if (requiredTag.pattern && !new RegExp(requiredTag.pattern).test(tagValue)) {
          validation.errors.push(
            `Tag "${requiredTag.key}" value "${tagValue}" does not match required pattern: ${requiredTag.pattern}`
          );
          validation.valid = false;
        }
      }
    }
  }

  res.json({
    success: true,
    data: { validation },
  });
}));

export default router;