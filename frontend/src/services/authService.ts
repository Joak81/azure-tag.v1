import { AccountInfo, InteractionRequiredAuthError, IPublicClientApplication } from '@azure/msal-browser';
import { azureManagementRequest } from '../config/authConfig';

export class AuthService {
  private msalInstance: IPublicClientApplication;

  constructor(msalInstance: IPublicClientApplication) {
    this.msalInstance = msalInstance;
  }

  /**
   * Get the current user account
   */
  getAccount(): AccountInfo | null {
    const currentAccounts = this.msalInstance.getAllAccounts();
    if (currentAccounts.length === 0) {
      return null;
    }
    return currentAccounts[0];
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getAccount() !== null;
  }

  /**
   * Get access token for Azure Management API
   */
  async getAccessToken(): Promise<string> {
    const account = this.getAccount();
    if (!account) {
      throw new Error('No account found. Please sign in.');
    }

    try {
      const response = await this.msalInstance.acquireTokenSilent({
        ...azureManagementRequest,
        account: account,
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // fallback to interaction when silent call fails
        this.msalInstance.acquireTokenRedirect({
          scopes: ['User.Read'],
          account: account
        });
        throw new Error('Redirect initiated');
      }
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(): Promise<void> {
    try {
      await this.msalInstance.loginRedirect({
        scopes: ['User.Read']
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const account = this.getAccount();
    if (account) {
      await this.msalInstance.logoutPopup({
        account: account,
        postLogoutRedirectUri: window.location.origin,
      });
    }
  }

  /**
   * Get user information
   */
  getUserInfo(): { name?: string; email?: string; id?: string } | null {
    const account = this.getAccount();
    if (!account) return null;

    return {
      name: account.name,
      email: account.username,
      id: account.homeAccountId,
    };
  }
}