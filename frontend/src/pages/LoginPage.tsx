import React from 'react';
import {
  Text,
  Button,
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ShieldTaskRegular, TagRegular } from '@fluentui/react-icons';
import { useAuth } from '../hooks/useAuth';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
    padding: '20px',
  },
  card: {
    maxWidth: '400px',
    width: '100%',
  },
  cardPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    backgroundColor: tokens.colorBrandBackground,
  },
  icon: {
    fontSize: '64px',
    color: tokens.colorNeutralForegroundOnBrand,
  },
  cardHeader: {
    padding: '20px 20px 10px',
  },
  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
    marginTop: '8px',
  },
  cardFooter: {
    padding: '10px 20px 20px',
  },
  loginButton: {
    width: '100%',
  },
  features: {
    listStyle: 'none',
    padding: '0 20px',
    margin: '20px 0',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '8px 0',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  featureIcon: {
    fontSize: '16px',
    color: tokens.colorBrandForeground1,
  },
});

export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const styles = useStyles();

  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardPreview className={styles.cardPreview}>
          <TagRegular className={styles.icon} />
        </CardPreview>

        <CardHeader className={styles.cardHeader}>
          <Text className={styles.title}>Azure Tag Manager</Text>
          <Text className={styles.subtitle}>
            Gestão centralizada de tags em recursos Azure
          </Text>
        </CardHeader>

        <ul className={styles.features}>
          <li className={styles.feature}>
            <ShieldTaskRegular className={styles.featureIcon} />
            Autenticação SSO com Azure AD
          </li>
          <li className={styles.feature}>
            <TagRegular className={styles.featureIcon} />
            Gestão de tags unitária e em bulk
          </li>
          <li className={styles.feature}>
            <ShieldTaskRegular className={styles.featureIcon} />
            Dashboard de compliance
          </li>
        </ul>

        <CardFooter className={styles.cardFooter}>
          <Button
            appearance="primary"
            size="large"
            className={styles.loginButton}
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'A iniciar sessão...' : 'Iniciar sessão com Microsoft'}
          </Button>

          {error && (
            <Text style={{
              color: tokens.colorPaletteRedForeground1,
              fontSize: tokens.fontSizeBase200,
              textAlign: 'center',
              marginTop: '8px'
            }}>
              {error}
            </Text>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};