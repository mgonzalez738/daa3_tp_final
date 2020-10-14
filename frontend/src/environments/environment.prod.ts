import { AuthenticationType } from 'azure-maps-control';

export const environment = {
  production: true,
  socketEndpoint: "https://giemonitoring.azurewebsites.net",
  backendApiUrl: "https://giemonitoring.azurewebsites.net/api",
  azureMapAuthOptions: {
    authType: AuthenticationType.subscriptionKey,
    subscriptionKey: 'XRCgif7kmtqAjBDsYI5p3d-L9mvC7MfkN6G4Cyuckzk'
  }
};
