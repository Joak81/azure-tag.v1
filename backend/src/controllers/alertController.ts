import { Router, Request, Response } from 'express';
import { asyncHandler, badRequest, notFound } from '../middleware/errorHandler';
import { AzureService } from '../services/azureService';
import { EmailService } from '../services/emailService';
import Joi from 'joi';
import cron from 'node-cron';

const router = Router();
const azureService = new AzureService();
const emailService = new EmailService();

// In-memory storage for alerts (in production, use a database)
let alerts: Array<{
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  conditions: Array<{
    type: 'missing_tag' | 'invalid_tag_value' | 'resource_type' | 'cost_threshold';
    tagKey?: string;
    tagValue?: string;
    allowedValues?: string[];
    resourceType?: string;
    threshold?: number;
  }>;
  recipients: string[];
  scope: {
    subscriptions?: string[];
    resourceGroups?: string[];
  };
  lastTriggered?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: '1',
    name: 'Missing Environment Tag',
    description: 'Alert when resources are missing the Environment tag',
    enabled: true,
    frequency: 'daily',
    conditions: [
      {
        type: 'missing_tag',
        tagKey: 'Environment',
      },
    ],
    recipients: ['admin@company.com', 'finops@company.com'],
    scope: {},
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Missing Owner Tag',
    description: 'Alert when resources are missing the Owner tag',
    enabled: true,
    frequency: 'weekly',
    conditions: [
      {
        type: 'missing_tag',
        tagKey: 'Owner',
      },
    ],
    recipients: ['admin@company.com'],
    scope: {},
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Validation schemas
const createAlertSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(500),
  enabled: Joi.boolean().default(true),
  frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
  conditions: Joi.array().items(Joi.object({
    type: Joi.string().valid('missing_tag', 'invalid_tag_value', 'resource_type', 'cost_threshold').required(),
    tagKey: Joi.string().optional(),
    tagValue: Joi.string().optional(),
    allowedValues: Joi.array().items(Joi.string()).optional(),
    resourceType: Joi.string().optional(),
    threshold: Joi.number().optional(),
  })).min(1).required(),
  recipients: Joi.array().items(Joi.string().email()).min(1).required(),
  scope: Joi.object({
    subscriptions: Joi.array().items(Joi.string()).optional(),
    resourceGroups: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

const updateAlertSchema = Joi.object({
  name: Joi.string().optional().min(1).max(100),
  description: Joi.string().optional().max(500),
  enabled: Joi.boolean().optional(),
  frequency: Joi.string().valid('daily', 'weekly', 'monthly').optional(),
  conditions: Joi.array().items(Joi.object({
    type: Joi.string().valid('missing_tag', 'invalid_tag_value', 'resource_type', 'cost_threshold').required(),
    tagKey: Joi.string().optional(),
    tagValue: Joi.string().optional(),
    allowedValues: Joi.array().items(Joi.string()).optional(),
    resourceType: Joi.string().optional(),
    threshold: Joi.number().optional(),
  })).min(1).optional(),
  recipients: Joi.array().items(Joi.string().email()).min(1).optional(),
  scope: Joi.object({
    subscriptions: Joi.array().items(Joi.string()).optional(),
    resourceGroups: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

/**
 * GET /api/alerts
 * Get all alert rules
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { enabled } = req.query;

  let filteredAlerts = alerts;

  if (enabled !== undefined) {
    filteredAlerts = alerts.filter(alert =>
      alert.enabled === (enabled === 'true')
    );
  }

  res.json({
    success: true,
    data: { alerts: filteredAlerts },
  });
}));

/**
 * POST /api/alerts
 * Create a new alert rule
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createAlertSchema.validate(req.body);
  if (error) {
    throw badRequest(error.details[0].message);
  }

  const newAlert = {
    id: Date.now().toString(),
    ...value,
    scope: value.scope || {},
    createdBy: req.user?.email || 'unknown',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  alerts.push(newAlert);

  res.status(201).json({
    success: true,
    data: { alert: newAlert },
    message: 'Alert created successfully',
  });
}));

/**
 * GET /api/alerts/:alertId
 * Get a specific alert rule
 */
router.get('/:alertId', asyncHandler(async (req: Request, res: Response) => {
  const { alertId } = req.params;

  const alert = alerts.find(a => a.id === alertId);

  if (!alert) {
    throw notFound('Alert');
  }

  res.json({
    success: true,
    data: { alert },
  });
}));

/**
 * PUT /api/alerts/:alertId
 * Update an alert rule
 */
router.put('/:alertId', asyncHandler(async (req: Request, res: Response) => {
  const { alertId } = req.params;
  const { error, value } = updateAlertSchema.validate(req.body);

  if (error) {
    throw badRequest(error.details[0].message);
  }

  const alertIndex = alerts.findIndex(a => a.id === alertId);

  if (alertIndex === -1) {
    throw notFound('Alert');
  }

  alerts[alertIndex] = {
    ...alerts[alertIndex],
    ...value,
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: { alert: alerts[alertIndex] },
    message: 'Alert updated successfully',
  });
}));

/**
 * DELETE /api/alerts/:alertId
 * Delete an alert rule
 */
router.delete('/:alertId', asyncHandler(async (req: Request, res: Response) => {
  const { alertId } = req.params;

  const alertIndex = alerts.findIndex(a => a.id === alertId);

  if (alertIndex === -1) {
    throw notFound('Alert');
  }

  alerts.splice(alertIndex, 1);

  res.json({
    success: true,
    message: 'Alert deleted successfully',
  });
}));

/**
 * POST /api/alerts/:alertId/test
 * Test an alert rule (trigger manually)
 */
router.post('/:alertId/test', asyncHandler(async (req: Request, res: Response) => {
  const { alertId } = req.params;
  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  const alert = alerts.find(a => a.id === alertId);

  if (!alert) {
    throw notFound('Alert');
  }

  // Execute the alert check
  const alertResults = await executeAlertCheck(alert, userToken);

  // Send test email if there are violations
  if (alertResults.violations.length > 0) {
    await emailService.sendAlertEmail(alert, alertResults.violations, true);
  }

  res.json({
    success: true,
    data: {
      alert: alert.name,
      violations: alertResults.violations,
      summary: alertResults.summary,
    },
    message: alertResults.violations.length > 0
      ? 'Alert test completed - violations found and email sent'
      : 'Alert test completed - no violations found',
  });
}));

/**
 * POST /api/alerts/check-all
 * Manually trigger all enabled alerts
 */
router.post('/check-all', asyncHandler(async (req: Request, res: Response) => {
  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  const enabledAlerts = alerts.filter(a => a.enabled);
  const results = [];

  for (const alert of enabledAlerts) {
    try {
      const alertResults = await executeAlertCheck(alert, userToken);

      if (alertResults.violations.length > 0) {
        await emailService.sendAlertEmail(alert, alertResults.violations, false);

        // Update last triggered timestamp
        const alertIndex = alerts.findIndex(a => a.id === alert.id);
        if (alertIndex !== -1) {
          alerts[alertIndex].lastTriggered = new Date().toISOString();
        }
      }

      results.push({
        alertId: alert.id,
        alertName: alert.name,
        violationsFound: alertResults.violations.length,
        emailSent: alertResults.violations.length > 0,
      });
    } catch (error) {
      results.push({
        alertId: alert.id,
        alertName: alert.name,
        error: error.message,
      });
    }
  }

  res.json({
    success: true,
    data: { results },
    message: 'Alert check completed for all enabled alerts',
  });
}));

/**
 * Execute alert check logic
 */
async function executeAlertCheck(alert: any, userToken: string): Promise<{
  violations: any[];
  summary: any;
}> {
  // Get all resources based on alert scope
  const allResources: any[] = [];

  if (alert.scope.subscriptions && alert.scope.subscriptions.length > 0) {
    // Check specific subscriptions
    for (const subscriptionId of alert.scope.subscriptions) {
      try {
        const resources = await azureService.getResources(subscriptionId, userToken);
        allResources.push(...resources);
      } catch (error) {
        console.warn(`Failed to fetch resources from subscription ${subscriptionId}`);
      }
    }
  } else {
    // Check all accessible subscriptions
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

  // Filter by resource groups if specified
  const filteredResources = alert.scope.resourceGroups && alert.scope.resourceGroups.length > 0
    ? allResources.filter(resource =>
        alert.scope.resourceGroups.includes(resource.resourceGroup)
      )
    : allResources;

  // Check alert conditions
  const violations = [];

  for (const resource of filteredResources) {
    for (const condition of alert.conditions) {
      let violationFound = false;
      let violationReason = '';

      switch (condition.type) {
        case 'missing_tag':
          if (!resource.tags || !resource.tags[condition.tagKey!]) {
            violationFound = true;
            violationReason = `Missing required tag: ${condition.tagKey}`;
          }
          break;

        case 'invalid_tag_value':
          if (resource.tags && resource.tags[condition.tagKey!]) {
            const tagValue = resource.tags[condition.tagKey!];
            if (condition.allowedValues && !condition.allowedValues.includes(tagValue)) {
              violationFound = true;
              violationReason = `Invalid tag value for ${condition.tagKey}: "${tagValue}". Allowed values: ${condition.allowedValues.join(', ')}`;
            }
          }
          break;

        case 'resource_type':
          if (condition.resourceType && resource.type === condition.resourceType) {
            violationFound = true;
            violationReason = `Resource type ${condition.resourceType} matches alert condition`;
          }
          break;

        case 'cost_threshold':
          // This would require integration with Azure Cost Management API
          // For now, skip cost-based alerts
          break;
      }

      if (violationFound) {
        violations.push({
          resourceId: resource.id,
          resourceName: resource.name,
          resourceType: resource.type,
          resourceGroup: resource.resourceGroup,
          subscriptionId: resource.subscriptionId,
          location: resource.location,
          condition: condition,
          reason: violationReason,
          tags: resource.tags || {},
        });
      }
    }
  }

  const summary = {
    totalResourcesChecked: filteredResources.length,
    violationsFound: violations.length,
    alertConditions: alert.conditions.length,
  };

  return { violations, summary };
}

// Schedule automated alert checks
if (process.env.NODE_ENV === 'production') {
  // Daily check at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily alert checks...');
    try {
      // In a real implementation, you'd need to get a service principal token
      // For now, this is a placeholder
      const dailyAlerts = alerts.filter(a => a.enabled && a.frequency === 'daily');
      console.log(`Checking ${dailyAlerts.length} daily alerts`);
    } catch (error) {
      console.error('Error running daily alert checks:', error);
    }
  });

  // Weekly check on Mondays at 9 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('Running weekly alert checks...');
    try {
      const weeklyAlerts = alerts.filter(a => a.enabled && a.frequency === 'weekly');
      console.log(`Checking ${weeklyAlerts.length} weekly alerts`);
    } catch (error) {
      console.error('Error running weekly alert checks:', error);
    }
  });

  // Monthly check on the 1st at 9 AM
  cron.schedule('0 9 1 * *', async () => {
    console.log('Running monthly alert checks...');
    try {
      const monthlyAlerts = alerts.filter(a => a.enabled && a.frequency === 'monthly');
      console.log(`Checking ${monthlyAlerts.length} monthly alerts`);
    } catch (error) {
      console.error('Error running monthly alert checks:', error);
    }
  });
}

export default router;