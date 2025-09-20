import React, { ReactNode } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  MenuList,
  MenuItem,
  MenuPopover,
  MenuTrigger,
  Menu,
} from '@fluentui/react-components';
import {
  HomeRegular,
  TagRegular,
  DocumentTableRegular,
  SettingsRegular,
  ChevronDownRegular,
  PersonRegular
} from '@fluentui/react-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100vh',
    width: '100%',
  },
  sidebar: {
    width: '250px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '32px',
    padding: '8px',
  },
  logoIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
  },
  logoText: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  navigation: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  navItem: {
    width: '100%',
    justifyContent: 'flex-start',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: tokens.borderRadiusMedium,
  },
  activeNavItem: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  userSection: {
    marginTop: 'auto',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingTop: '16px',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: '24px',
    overflow: 'auto',
  },
});

interface LayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { path: '/', label: 'Dashboard', icon: HomeRegular },
  { path: '/resources', label: 'Resources', icon: DocumentTableRegular },
  { path: '/tags', label: 'Tag Management', icon: TagRegular },
  { path: '/reports', label: 'Reports', icon: DocumentTableRegular },
  { path: '/settings', label: 'Settings', icon: SettingsRegular },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <TagRegular className={styles.logoIcon} />
          <Text className={styles.logoText}>Tag Manager</Text>
        </div>

        <nav className={styles.navigation}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Button
                key={item.path}
                appearance="transparent"
                className={`${styles.navItem} ${isActive ? styles.activeNavItem : ''}`}
                icon={<Icon />}
                onClick={() => handleNavigation(item.path)}
              >
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className={styles.userSection}>
          <div style={{ marginBottom: '12px', padding: '8px', borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground3 }}>
            <Text size={100} style={{ color: tokens.colorNeutralForeground2 }}>
              v1.0.0 - Build {new Date().toISOString().slice(0, 10).replace(/-/g, '')}
            </Text>
            <br />
            <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
              Backend: {window.location.hostname === 'localhost' ? 'Dev' : 'Prod'}
            </Text>
          </div>

          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="transparent"
                icon={<PersonRegular />}
                iconPosition="before"
                className={styles.navItem}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <Text size={200} weight="medium">{user?.name}</Text>
                    <br />
                    <Text size={100} style={{ color: tokens.colorNeutralForeground2 }}>
                      {user?.email}
                    </Text>
                  </div>
                  <ChevronDownRegular />
                </div>
              </Button>
            </MenuTrigger>

            <MenuPopover>
              <MenuList>
                <MenuItem onClick={handleLogout}>
                  Sign out
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
};