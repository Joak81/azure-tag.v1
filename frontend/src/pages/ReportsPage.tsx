import React, { useState } from 'react';
import {
  Text,
  Button,
  Card,
  makeStyles,
  tokens,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import {
  DocumentTableRegular,
  ArrowDownloadRegular,
  ChartMultipleRegular,
  CalendarRegular,
} from '@fluentui/react-icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '20px',
  },
  chartCard: {
    padding: '20px',
  },
  chartTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
  },
  chartContainer: {
    width: '100%',
    height: '300px',
  },
  exportSection: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    padding: '16px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginTop: '4px',
  },
});

// Mock data for charts
const complianceData = [
  { name: 'Environment', compliant: 1124, nonCompliant: 123 },
  { name: 'Owner', compliant: 987, nonCompliant: 260 },
  { name: 'CostCenter', compliant: 823, nonCompliant: 424 },
  { name: 'Project', compliant: 1034, nonCompliant: 213 },
];

const subscriptionData = [
  { name: 'Production', value: 567, color: '#0078D4' },
  { name: 'Development', value: 345, color: '#00BCF2' },
  { name: 'Staging', value: 234, color: '#40E0D0' },
  { name: 'Test', value: 101, color: '#1BA1E2' },
];

const trendData = [
  { month: 'Jan', compliance: 78 },
  { month: 'Feb', compliance: 82 },
  { month: 'Mar', compliance: 79 },
  { month: 'Apr', compliance: 85 },
  { month: 'May', compliance: 87 },
  { month: 'Jun', compliance: 91 },
];

const COLORS = ['#0078D4', '#00BCF2', '#40E0D0', '#1BA1E2'];

export const ReportsPage: React.FC = () => {
  const styles = useStyles();
  const [selectedPeriod, setSelectedPeriod] = useState('last30days');
  const [selectedSubscription, setSelectedSubscription] = useState('all');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Reports & Analytics</Text>
        <div className={styles.exportSection}>
          <Button appearance="primary" icon={<ArrowDownloadRegular />}>
            Export Report
          </Button>
          <Button appearance="secondary" icon={<DocumentTableRegular />}>
            Schedule Report
          </Button>
        </div>
      </div>

      <div className={styles.filters}>
        <Dropdown
          placeholder="Time Period"
          value={selectedPeriod}
          onOptionSelect={(_, data) => setSelectedPeriod(data.optionValue || '')}
        >
          <Option value="last7days">Last 7 days</Option>
          <Option value="last30days">Last 30 days</Option>
          <Option value="last90days">Last 90 days</Option>
          <Option value="last12months">Last 12 months</Option>
          <Option value="custom">Custom Range</Option>
        </Dropdown>

        <Dropdown
          placeholder="Subscription"
          value={selectedSubscription}
          onOptionSelect={(_, data) => setSelectedSubscription(data.optionValue || '')}
        >
          <Option value="all">All Subscriptions</Option>
          <Option value="production">Production</Option>
          <Option value="development">Development</Option>
          <Option value="staging">Staging</Option>
        </Dropdown>

        <Button appearance="secondary" icon={<CalendarRegular />}>
          Custom Date Range
        </Button>
      </div>

      {/* Key Statistics */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <Text className={styles.statValue}>1,247</Text>
          <Text className={styles.statLabel}>Total Resources</Text>
        </Card>
        <Card className={styles.statCard}>
          <Text className={styles.statValue}>87%</Text>
          <Text className={styles.statLabel}>Overall Compliance</Text>
        </Card>
        <Card className={styles.statCard}>
          <Text className={styles.statValue}>158</Text>
          <Text className={styles.statLabel}>Non-Compliant Resources</Text>
        </Card>
        <Card className={styles.statCard}>
          <Text className={styles.statValue}>23</Text>
          <Text className={styles.statLabel}>Active Alerts</Text>
        </Card>
      </div>

      {/* Charts */}
      <div className={styles.reportsGrid}>
        {/* Compliance by Tag Category */}
        <Card className={styles.chartCard}>
          <Text className={styles.chartTitle}>Compliance by Tag Category</Text>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="compliant" fill="#107C10" name="Compliant" />
                <Bar dataKey="nonCompliant" fill="#D13438" name="Non-Compliant" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Resources by Subscription */}
        <Card className={styles.chartCard}>
          <Text className={styles.chartTitle}>Resources by Subscription</Text>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Compliance Trend */}
        <Card className={styles.chartCard}>
          <Text className={styles.chartTitle}>Compliance Trend (Last 6 Months)</Text>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="compliance"
                  stroke="#0078D4"
                  strokeWidth={2}
                  name="Compliance %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Cost Impact by Tags */}
        <Card className={styles.chartCard}>
          <Text className={styles.chartTitle}>Cost Impact by Tags</Text>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Production', cost: 45000 },
                { name: 'Development', cost: 12000 },
                { name: 'Staging', cost: 8000 },
                { name: 'Test', cost: 3000 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                <Bar dataKey="cost" fill="#FFB900" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Export Options */}
      <Card style={{ padding: '20px' }}>
        <Text className={styles.chartTitle}>Export Options</Text>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <Button appearance="secondary" icon={<ArrowDownloadRegular />}>
            Export as PDF
          </Button>
          <Button appearance="secondary" icon={<ArrowDownloadRegular />}>
            Export as Excel
          </Button>
          <Button appearance="secondary" icon={<ArrowDownloadRegular />}>
            Export as CSV
          </Button>
          <Button appearance="secondary" icon={<ChartMultipleRegular />}>
            Create Custom Report
          </Button>
        </div>
      </Card>
    </div>
  );
};