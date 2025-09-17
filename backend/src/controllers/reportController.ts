import { Router, Request, Response } from 'express';
import { asyncHandler, badRequest } from '../middleware/errorHandler';
import { AzureService } from '../services/azureService';
import Joi from 'joi';

const router = Router();
const azureService = new AzureService();

// Validation schemas
const reportRequestSchema = Joi.object({
  type: Joi.string().valid('compliance', 'costs', 'resources', 'usage').required(),
  subscriptionId: Joi.string().optional(),
  resourceGroupName: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  format: Joi.string().valid('json', 'csv', 'excel', 'pdf').default('json'),
  includeDetails: Joi.boolean().default(false),
});

/**
 * GET /api/reports/compliance
 * Generate compliance report
 */
router.get('/compliance', asyncHandler(async (req: Request, res: Response) => {
  const { subscriptionId, format = 'json', includeDetails = false } = req.query;
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

  // Calculate compliance metrics
  const totalResources = allResources.length;
  const taggedResources = allResources.filter(r => r.tags && Object.keys(r.tags).length > 0);
  const untaggedResources = allResources.filter(r => !r.tags || Object.keys(r.tags).length === 0);

  // Group by resource type
  const resourceTypeBreakdown = allResources.reduce((acc, resource) => {
    const type = resource.type;
    if (!acc[type]) {
      acc[type] = {
        total: 0,
        tagged: 0,
        untagged: 0,
        percentage: 0,
      };
    }
    acc[type].total++;
    if (resource.tags && Object.keys(resource.tags).length > 0) {
      acc[type].tagged++;
    } else {
      acc[type].untagged++;
    }
    acc[type].percentage = Math.round((acc[type].tagged / acc[type].total) * 100);
    return acc;
  }, {} as Record<string, any>);

  // Group by subscription
  const subscriptionBreakdown = allResources.reduce((acc, resource) => {
    const subId = resource.subscriptionId;
    if (!acc[subId]) {
      acc[subId] = {
        total: 0,
        tagged: 0,
        untagged: 0,
        percentage: 0,
      };
    }
    acc[subId].total++;
    if (resource.tags && Object.keys(resource.tags).length > 0) {
      acc[subId].tagged++;
    } else {
      acc[subId].untagged++;
    }
    acc[subId].percentage = Math.round((acc[subId].tagged / acc[subId].total) * 100);
    return acc;
  }, {} as Record<string, any>);

  // Most common tags
  const tagFrequency = allResources.reduce((acc, resource) => {
    if (resource.tags) {
      Object.keys(resource.tags).forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const mostCommonTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: Math.round((count / totalResources) * 100),
    }));

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.email || 'system',
      reportType: 'compliance',
      subscriptionFilter: subscriptionId || 'all',
    },
    summary: {
      totalResources,
      taggedResources: taggedResources.length,
      untaggedResources: untaggedResources.length,
      compliancePercentage: Math.round((taggedResources.length / totalResources) * 100),
    },
    breakdown: {
      byResourceType: resourceTypeBreakdown,
      bySubscription: subscriptionBreakdown,
    },
    insights: {
      mostCommonTags,
      tagCoverage: mostCommonTags.map(({ tag, percentage }) => ({
        tag,
        coverage: percentage,
      })),
    },
  };

  // Include detailed resource list if requested
  if (includeDetails === 'true') {
    (report as any).details = {
      taggedResources: taggedResources.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        tags: r.tags,
      })),
      untaggedResources: untaggedResources.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        location: r.location,
        resourceGroup: r.resourceGroup,
      })),
    };
  }

  if (format === 'csv') {
    // Convert to CSV format
    const csv = convertComplianceReportToCSV(report, includeDetails === 'true');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  }

  res.json({
    success: true,
    data: { report },
  });
}));

/**
 * GET /api/reports/costs
 * Generate cost analysis report by tags
 */
router.get('/costs', asyncHandler(async (req: Request, res: Response) => {
  const { subscriptionId, startDate, endDate, format = 'json' } = req.query;

  // Mock data for cost analysis
  // In a real implementation, this would integrate with Azure Cost Management APIs
  const mockCostData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.email || 'system',
      reportType: 'costs',
      period: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString(),
      },
    },
    summary: {
      totalCost: 12450.75,
      currency: 'USD',
      taggedResourcesCost: 10890.25,
      untaggedResourcesCost: 1560.50,
      taggedPercentage: 87.5,
    },
    breakdown: {
      byEnvironment: [
        { tag: 'Production', cost: 8500.00, percentage: 68.3 },
        { tag: 'Development', cost: 2390.25, percentage: 19.2 },
        { tag: 'Staging', cost: 1000.00, percentage: 8.0 },
        { tag: 'Test', cost: 560.50, percentage: 4.5 },
      ],
      byCostCenter: [
        { tag: 'IT-001', cost: 6000.00, percentage: 48.2 },
        { tag: 'IT-002', cost: 3500.00, percentage: 28.1 },
        { tag: 'IT-003', cost: 1390.25, percentage: 11.2 },
        { tag: 'Untagged', cost: 1560.50, percentage: 12.5 },
      ],
      byResourceType: [
        { type: 'Microsoft.Compute/virtualMachines', cost: 5500.00, percentage: 44.2 },
        { type: 'Microsoft.Storage/storageAccounts', cost: 2800.00, percentage: 22.5 },
        { type: 'Microsoft.Web/sites', cost: 1950.75, percentage: 15.7 },
        { type: 'Microsoft.Sql/servers', cost: 1200.00, percentage: 9.6 },
        { type: 'Others', cost: 1000.00, percentage: 8.0 },
      ],
    },
    trends: {
      dailyCosts: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cost: Math.round((300 + Math.random() * 200) * 100) / 100,
      })),
    },
  };

  res.json({
    success: true,
    data: { report: mockCostData },
  });
}));

/**
 * GET /api/reports/resources
 * Generate resource inventory report
 */
router.get('/resources', asyncHandler(async (req: Request, res: Response) => {
  const { subscriptionId, resourceType, location, format = 'json' } = req.query;
  const userToken = req.accessToken;

  if (!userToken) {
    throw badRequest('Access token not available');
  }

  // Get all resources with filters
  const allResources: any[] = [];

  if (subscriptionId) {
    const resources = await azureService.getResources(subscriptionId as string, userToken, {
      resourceType: resourceType as string,
    });
    allResources.push(...resources);
  } else {
    const subscriptions = await azureService.getSubscriptions(userToken);
    for (const subscription of subscriptions) {
      try {
        const resources = await azureService.getResources(subscription.subscriptionId, userToken, {
          resourceType: resourceType as string,
        });
        allResources.push(...resources);
      } catch (error) {
        console.warn(`Failed to fetch resources from subscription ${subscription.subscriptionId}`);
      }
    }
  }

  // Apply location filter if specified
  const filteredResources = location
    ? allResources.filter(r => r.location === location)
    : allResources;

  // Generate report
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.email || 'system',
      reportType: 'resources',
      filters: {
        subscriptionId: subscriptionId || 'all',
        resourceType: resourceType || 'all',
        location: location || 'all',
      },
    },
    summary: {
      totalResources: filteredResources.length,
      uniqueResourceTypes: [...new Set(filteredResources.map(r => r.type))].length,
      uniqueLocations: [...new Set(filteredResources.map(r => r.location))].length,
      uniqueResourceGroups: [...new Set(filteredResources.map(r => r.resourceGroup))].length,
    },
    breakdown: {
      byType: filteredResources.reduce((acc, resource) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byLocation: filteredResources.reduce((acc, resource) => {
        acc[resource.location] = (acc[resource.location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySubscription: filteredResources.reduce((acc, resource) => {
        acc[resource.subscriptionId] = (acc[resource.subscriptionId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    resources: filteredResources.map(resource => ({
      id: resource.id,
      name: resource.name,
      type: resource.type,
      location: resource.location,
      resourceGroup: resource.resourceGroup,
      subscriptionId: resource.subscriptionId,
      tags: resource.tags || {},
      tagCount: Object.keys(resource.tags || {}).length,
    })),
  };

  if (format === 'csv') {
    const csv = convertResourceReportToCSV(report);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="resource-inventory-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  }

  res.json({
    success: true,
    data: { report },
  });
}));

/**
 * POST /api/reports/export
 * Generate and export custom reports
 */
router.post('/export', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = reportRequestSchema.validate(req.body);
  if (error) {
    throw badRequest(error.details[0].message);
  }

  const { type, subscriptionId, resourceGroupName, startDate, endDate, format, includeDetails } = value;

  // Generate report based on type
  let reportData;

  switch (type) {
    case 'compliance':
      // Reuse compliance report logic
      reportData = await generateComplianceReport(req, subscriptionId, includeDetails);
      break;
    case 'costs':
      // Reuse cost report logic
      reportData = await generateCostReport(req, subscriptionId, startDate, endDate);
      break;
    case 'resources':
      // Reuse resource report logic
      reportData = await generateResourceReport(req, subscriptionId, resourceGroupName);
      break;
    default:
      throw badRequest('Invalid report type');
  }

  // Handle different export formats
  if (format === 'csv') {
    const csv = convertReportToCSV(reportData, type);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  }

  res.json({
    success: true,
    data: { report: reportData },
    message: 'Report generated successfully',
  });
}));

// Helper functions
function convertComplianceReportToCSV(report: any, includeDetails: boolean): string {
  let csv = 'Report Type,Compliance Report\n';
  csv += `Generated At,${report.metadata.generatedAt}\n`;
  csv += `Total Resources,${report.summary.totalResources}\n`;
  csv += `Tagged Resources,${report.summary.taggedResources}\n`;
  csv += `Untagged Resources,${report.summary.untaggedResources}\n`;
  csv += `Compliance Percentage,${report.summary.compliancePercentage}%\n\n`;

  if (includeDetails && report.details) {
    csv += 'Untagged Resources\n';
    csv += 'Resource ID,Name,Type,Location,Resource Group\n';
    report.details.untaggedResources.forEach((resource: any) => {
      csv += `${resource.id},${resource.name},${resource.type},${resource.location},${resource.resourceGroup}\n`;
    });
  }

  return csv;
}

function convertResourceReportToCSV(report: any): string {
  let csv = 'Resource ID,Name,Type,Location,Resource Group,Subscription ID,Tag Count\n';
  report.resources.forEach((resource: any) => {
    csv += `${resource.id},${resource.name},${resource.type},${resource.location},${resource.resourceGroup},${resource.subscriptionId},${resource.tagCount}\n`;
  });
  return csv;
}

function convertReportToCSV(reportData: any, type: string): string {
  // This is a simplified implementation
  // In a real scenario, you'd have more sophisticated CSV conversion logic
  return JSON.stringify(reportData, null, 2);
}

async function generateComplianceReport(req: Request, subscriptionId: string, includeDetails: boolean): Promise<any> {
  // Implementation would be similar to GET /compliance endpoint
  return {};
}

async function generateCostReport(req: Request, subscriptionId: string, startDate: string, endDate: string): Promise<any> {
  // Implementation would be similar to GET /costs endpoint
  return {};
}

async function generateResourceReport(req: Request, subscriptionId: string, resourceGroupName: string): Promise<any> {
  // Implementation would be similar to GET /resources endpoint
  return {};
}

export default router;