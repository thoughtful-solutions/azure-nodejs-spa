import React, { useState, useEffect } from 'react';
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: 'dd65fe70-54eb-4706-a87d-adf3e3e92e59',
    authority: 'https://login.microsoftonline.com/9cab9fea-e61b-4050-90d2-c8e2b0d9676c',
    redirectUri: 'https://faasstorage111.z35.web.core.windows.net'
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeMsal = async () => {
      await msalInstance.initialize();
      await checkAuth();
    };

    initializeMsal();
  }, []);

  const checkAuth = async () => {
    console.log("Checking authentication status...");
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      console.log("User is already signed in:", accounts[0]);
      setIsAuthenticated(true);
      setUser(accounts[0]);
      await getGroupsFromToken(accounts[0]);
    } else {
      console.log("No signed-in user found");
    }
  };

  const login = async () => {
    try {
      console.log("Login button clicked. Attempting to open login popup...");
      const result = await msalInstance.loginPopup({
        scopes: ['User.Read'],
        prompt: 'select_account'
      });
      console.log("Login successful", result);
      setIsAuthenticated(true);
      setUser(result.account);
      setError(null);
      await getGroupsFromToken(result.account);
    } catch (error) {
      console.error("Login failed", error);
      let errorMessage = "An unknown error occurred during login.";
      if (error instanceof InteractionRequiredAuthError) {
        errorMessage = "Interaction required. The user needs to interact with the login process.";
      } else if (error.errorCode) {
        errorMessage = `Error Code: ${error.errorCode}. ${error.errorMessage}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    }
  };

  const getGroupsFromToken = async (account) => {
    try {
      const silentRequest = {
        scopes: ["User.Read"],
        account: account,
        forceRefresh: false
      };
      const response = await msalInstance.acquireTokenSilent(silentRequest);
      const idToken = response.idToken;
      const decodedToken = JSON.parse(atob(idToken.split('.')[1]));
      const groups = decodedToken.groups || [];
      setGroups(groups);
    } catch (error) {
      console.error("Error getting groups from token:", error);
      setError("An error occurred while fetching group information.");
    }
  };

  const logout = async () => {
    try {
      const logoutRequest = {
        account: msalInstance.getAccountByUsername(user.username),
        postLogoutRedirectUri: msalConfig.auth.redirectUri,
      };
      await msalInstance.logoutPopup(logoutRequest);
      setIsAuthenticated(false);
      setUser(null);
      setGroups([]);
      setError(null);
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout failed", error);
      setError("An error occurred during logout.");
    }
  };

  return (
    <div>
      {!isAuthenticated ? (
        <div>
          <p>You are not signed in. Click the button below to sign in with your Microsoft account.</p>
          <button onClick={login}>Sign in with Microsoft</button>
          {error && <p style={{color: 'red'}}>Error: {error}</p>}
        </div>
      ) : (
        <div>
          <p>Welcome, {user.name}! You are signed in.</p>
          <p>Email: {user.username}</p>
          <h3>Your Groups:</h3>
          {groups.length > 0 ? (
            <ul>
              {groups.map((group, index) => (
                <li key={index}>{group}</li>
              ))}
            </ul>
          ) : (
            <p>You are not a member of any groups, or groups were not included in the token.</p>
          )}
          <button onClick={logout}>Sign out</button>
        </div>
      )}
    </div>
  );
}