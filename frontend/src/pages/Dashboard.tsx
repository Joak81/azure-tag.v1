import React, { useState, useEffect } from 'react';
import {
  Text,
  Card,
  CardHeader,
  CardPreview,
  makeStyles,
  tokens,
  ProgressBar,
  Button,
  Badge,
  Spinner,
} from '@fluentui/react-components';
import {
  TagRegular,
  DocumentTableRegular,
  ShieldTaskRegular,
  WarningRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
} from '@fluentui/react-icons';
import { apiService } from '../services/api';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    marginBottom: '8px',
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  statCard: {
    padding: '20px',
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  statTitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: '4px',
  },
  statValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  complianceSection: {
    marginTop: '24px',
  },
  complianceCard: {
    padding: '24px',
  },
  complianceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  complianceTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  progressItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  progressLabel: {
    minWidth: '120px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  progressBar: {
    flex: 1,
  },
  progressValue: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    minWidth: '40px',
    textAlign: 'right',
  },
  quickActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
});

export const Dashboard: React.FC = () => {
  const styles = useStyles();
  const [apiStatus, setApiStatus] = useState<{
    backend: 'loading' | 'online' | 'offline';
    azure: 'loading' | 'online' | 'offline';
    health?: any;
  }>({ backend: 'loading', azure: 'loading' });

  // Check API status
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const healthResponse = await apiService.healthCheck();
        if (healthResponse.success) {
          setApiStatus(prev => ({
            ...prev,
            backend: 'online',
            health: healthResponse.data
          }));

          // Test Azure API
          try {
            const subsResponse = await apiService.getSubscriptions();
            setApiStatus(prev => ({
              ...prev,
              azure: subsResponse.success ? 'online' : 'offline'
            }));
          } catch {
            setApiStatus(prev => ({ ...prev, azure: 'offline' }));
          }
        } else {
          setApiStatus(prev => ({ ...prev, backend: 'offline' }));
        }
      } catch {
        setApiStatus(prev => ({ ...prev, backend: 'offline', azure: 'offline' }));
      }
    };

    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Mock data - will be replaced with real data from API
  const stats = {
    totalResources: 1247,
    taggedResources: 1089,
    compliancePercentage: 87,
    alertsTriggered: 23,
  };

  const complianceData = [
    { label: 'Environment', percentage: 95, color: 'success' as const },
    { label: 'Owner', percentage: 78, color: 'warning' as const },
    { label: 'CostCenter', percentage: 65, color: 'error' as const },
    { label: 'Project', percentage: 82, color: 'brand' as const },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Text className={styles.title}>Dashboard</Text>
        <Text className={styles.subtitle}>
          Overview of your Azure resources and tag compliance
        </Text>
      </header>

      {/* API Status Card */}
      <Card style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text weight="semibold">Backend API:</Text>
            {apiStatus.backend === 'loading' ? (
              <Spinner size="tiny" />
            ) : apiStatus.backend === 'online' ? (
              <Badge color="success" icon={<CheckmarkCircleRegular />}>Online</Badge>
            ) : (
              <Badge color="danger" icon={<ErrorCircleRegular />}>Offline</Badge>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text weight="semibold">Azure APIs:</Text>
            {apiStatus.azure === 'loading' ? (
              <Spinner size="tiny" />
            ) : apiStatus.azure === 'online' ? (
              <Badge color="success" icon={<CheckmarkCircleRegular />}>Connected</Badge>
            ) : (
              <Badge color="danger" icon={<ErrorCircleRegular />}>Disconnected</Badge>
            )}
          </div>

          {apiStatus.health && (
            <div style={{ marginLeft: 'auto', fontSize: '12px', color: tokens.colorNeutralForeground2 }}>
              <Text size={200}>Version: {apiStatus.health.version} | Environment: {apiStatus.health.environment}</Text>
            </div>
          )}
        </div>
      </Card>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <CardPreview>
            <DocumentTableRegular
              className={styles.statIcon}
              style={{ color: tokens.colorPaletteBlueForeground2 }}
            />
          </CardPreview>
          <CardHeader>
            <Text className={styles.statTitle}>Total Resources</Text>
            <Text className={styles.statValue}>{stats.totalResources.toLocaleString()}</Text>
          </CardHeader>
        </Card>

        <Card className={styles.statCard}>
          <CardPreview>
            <TagRegular
              className={styles.statIcon}
              style={{ color: tokens.colorPaletteGreenForeground1 }}
            />
          </CardPreview>
          <CardHeader>
            <Text className={styles.statTitle}>Tagged Resources</Text>
            <Text className={styles.statValue}>{stats.taggedResources.toLocaleString()}</Text>
          </CardHeader>
        </Card>

        <Card className={styles.statCard}>
          <CardPreview>
            <ShieldTaskRegular
              className={styles.statIcon}
              style={{ color: tokens.colorPalettePurpleForeground2 }}
            />
          </CardPreview>
          <CardHeader>
            <Text className={styles.statTitle}>Compliance</Text>
            <Text className={styles.statValue}>{stats.compliancePercentage}%</Text>
          </CardHeader>
        </Card>

        <Card className={styles.statCard}>
          <CardPreview>
            <WarningRegular
              className={styles.statIcon}
              style={{ color: tokens.colorPaletteRedForeground1 }}
            />
          </CardPreview>
          <CardHeader>
            <Text className={styles.statTitle}>Active Alerts</Text>
            <Text className={styles.statValue}>{stats.alertsTriggered}</Text>
          </CardHeader>
        </Card>
      </div>

      <section className={styles.complianceSection}>
        <Card className={styles.complianceCard}>
          <div className={styles.complianceHeader}>
            <Text className={styles.complianceTitle}>Tag Compliance by Category</Text>
            <Button appearance="secondary" size="small">
              View Details
            </Button>
          </div>

          <div className={styles.progressSection}>
            {complianceData.map((item) => (
              <div key={item.label} className={styles.progressItem}>
                <Text className={styles.progressLabel}>{item.label}</Text>
                <ProgressBar
                  className={styles.progressBar}
                  value={item.percentage / 100}
                  color={item.color}
                />
                <Text className={styles.progressValue}>{item.percentage}%</Text>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <div className={styles.quickActions}>
        <Button appearance="primary">
          Bulk Tag Resources
        </Button>
        <Button appearance="secondary">
          Generate Report
        </Button>
        <Button appearance="secondary">
          View Non-Compliant Resources
        </Button>
      </div>
    </div>
  );
};