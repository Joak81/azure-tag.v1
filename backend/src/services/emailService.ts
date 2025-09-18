import * as nodemailer from 'nodemailer';
import { winstonLogger } from '../middleware/logger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.office365.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
      },
    });

    // Verify connection
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter.verify((error, success) => {
        if (error) {
          winstonLogger.error('Email service configuration error:', error);
        } else {
          winstonLogger.info('Email service is ready');
        }
      });
    }
  }

  /**
   * Send alert email for compliance violations
   */
  async sendAlertEmail(
    alert: any,
    violations: any[],
    isTest: boolean = false
  ): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      winstonLogger.warn('Email service not configured - skipping email send');
      return;
    }

    try {
      const subject = `${isTest ? '[TEST] ' : ''}Azure Tag Compliance Alert: ${alert.name}`;
      const htmlContent = this.generateAlertEmailHTML(alert, violations, isTest);
      const textContent = this.generateAlertEmailText(alert, violations, isTest);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: alert.recipients.join(', '),
        subject,
        text: textContent,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);

      winstonLogger.info('Alert email sent successfully', {
        alertId: alert.id,
        alertName: alert.name,
        recipients: alert.recipients,
        violationsCount: violations.length,
        isTest,
      });
    } catch (error) {
      winstonLogger.error('Failed to send alert email', {
        alertId: alert.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send compliance report via email
   */
  async sendComplianceReport(
    recipients: string[],
    reportData: any,
    reportType: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      winstonLogger.warn('Email service not configured - skipping email send');
      return;
    }

    try {
      const subject = `Azure Tag Compliance ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      const htmlContent = this.generateReportEmailHTML(reportData, reportType);
      const textContent = this.generateReportEmailText(reportData, reportType);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: recipients.join(', '),
        subject,
        text: textContent,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);

      winstonLogger.info('Compliance report email sent successfully', {
        recipients,
        reportType,
      });
    } catch (error) {
      winstonLogger.error('Failed to send compliance report email', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate HTML content for alert emails
   */
  private generateAlertEmailHTML(alert: any, violations: any[], isTest: boolean): string {
    const testBadge = isTest ? '<span style="background-color: #ff6b35; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">TEST</span>' : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Azure Tag Compliance Alert</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0078d4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .alert-info { background-color: white; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #0078d4; }
        .violations { background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #d13438; }
        .violation-item { border-bottom: 1px solid #e0e0e0; padding: 10px 0; }
        .violation-item:last-child { border-bottom: none; }
        .resource-name { font-weight: bold; color: #0078d4; }
        .reason { color: #d13438; font-weight: 500; margin-top: 5px; }
        .metadata { font-size: 12px; color: #666; margin-top: 5px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        .summary { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏷️ Azure Tag Compliance Alert ${testBadge}</h1>
        </div>

        <div class="content">
            <div class="alert-info">
                <h2>Alert: ${alert.name}</h2>
                <p><strong>Description:</strong> ${alert.description || 'No description provided'}</p>
                <p><strong>Frequency:</strong> ${alert.frequency}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <div class="summary">
                <h3>📊 Summary</h3>
                <p><strong>${violations.length}</strong> compliance violations found</p>
            </div>

            <div class="violations">
                <h3>🚨 Violations Found</h3>
                ${violations.map(violation => `
                    <div class="violation-item">
                        <div class="resource-name">${violation.resourceName}</div>
                        <div class="reason">${violation.reason}</div>
                        <div class="metadata">
                            Type: ${violation.resourceType} |
                            Resource Group: ${violation.resourceGroup} |
                            Location: ${violation.location}
                        </div>
                        <div class="metadata">
                            Resource ID: ${violation.resourceId}
                        </div>
                    </div>
                `).join('')}
            </div>

            ${isTest ? `
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin-top: 20px; border: 1px solid #ffeaa7;">
                    <strong>⚠️ This is a test alert.</strong> No automated actions have been taken.
                </div>
            ` : ''}
        </div>

        <div class="footer">
            <p>Generated by Azure Tag Manager | FinOps Team</p>
            <p>For questions or support, please contact the FinOps team</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text content for alert emails
   */
  private generateAlertEmailText(alert: any, violations: any[], isTest: boolean): string {
    const testPrefix = isTest ? '[TEST] ' : '';

    let text = `${testPrefix}AZURE TAG COMPLIANCE ALERT\n\n`;
    text += `Alert: ${alert.name}\n`;
    text += `Description: ${alert.description || 'No description provided'}\n`;
    text += `Frequency: ${alert.frequency}\n`;
    text += `Time: ${new Date().toLocaleString()}\n\n`;

    text += `SUMMARY\n`;
    text += `${violations.length} compliance violations found\n\n`;

    text += `VIOLATIONS FOUND:\n\n`;

    violations.forEach((violation, index) => {
      text += `${index + 1}. ${violation.resourceName}\n`;
      text += `   Reason: ${violation.reason}\n`;
      text += `   Type: ${violation.resourceType}\n`;
      text += `   Resource Group: ${violation.resourceGroup}\n`;
      text += `   Location: ${violation.location}\n`;
      text += `   Resource ID: ${violation.resourceId}\n\n`;
    });

    if (isTest) {
      text += `\nNOTE: This is a test alert. No automated actions have been taken.\n`;
    }

    text += `\n---\n`;
    text += `Generated by Azure Tag Manager | FinOps Team\n`;
    text += `For questions or support, please contact the FinOps team\n`;

    return text;
  }

  /**
   * Generate HTML content for compliance reports
   */
  private generateReportEmailHTML(reportData: any, reportType: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Azure Tag Compliance Report</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0078d4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .metric { background-color: white; padding: 15px; margin: 10px 0; border-radius: 6px; display: inline-block; min-width: 200px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #0078d4; }
        .metric-label { font-size: 14px; color: #666; }
        .chart-container { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Azure Tag Compliance ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h1>
        </div>

        <div class="content">
            <div class="metric">
                <div class="metric-value">${reportData.summary?.totalResources || 0}</div>
                <div class="metric-label">Total Resources</div>
            </div>

            <div class="metric">
                <div class="metric-value">${reportData.summary?.taggedResources || 0}</div>
                <div class="metric-label">Tagged Resources</div>
            </div>

            <div class="metric">
                <div class="metric-value">${reportData.summary?.compliancePercentage || 0}%</div>
                <div class="metric-label">Compliance</div>
            </div>

            <div class="chart-container">
                <h3>Key Insights</h3>
                <ul>
                    <li>Resources requiring attention: ${reportData.summary?.untaggedResources || 0}</li>
                    <li>Most common missing tags: Environment, Owner, CostCenter</li>
                    <li>Compliance trend: ${reportData.summary?.compliancePercentage > 85 ? 'Good' : 'Needs Improvement'}</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>Generated by Azure Tag Manager | FinOps Team</p>
            <p>Report generated on: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text content for compliance reports
   */
  private generateReportEmailText(reportData: any, reportType: string): string {
    let text = `AZURE TAG COMPLIANCE ${reportType.toUpperCase()} REPORT\n\n`;

    text += `SUMMARY:\n`;
    text += `Total Resources: ${reportData.summary?.totalResources || 0}\n`;
    text += `Tagged Resources: ${reportData.summary?.taggedResources || 0}\n`;
    text += `Compliance Percentage: ${reportData.summary?.compliancePercentage || 0}%\n\n`;

    text += `KEY INSIGHTS:\n`;
    text += `- Resources requiring attention: ${reportData.summary?.untaggedResources || 0}\n`;
    text += `- Most common missing tags: Environment, Owner, CostCenter\n`;
    text += `- Compliance trend: ${reportData.summary?.compliancePercentage > 85 ? 'Good' : 'Needs Improvement'}\n\n`;

    text += `---\n`;
    text += `Generated by Azure Tag Manager | FinOps Team\n`;
    text += `Report generated on: ${new Date().toLocaleString()}\n`;

    return text;
  }
}