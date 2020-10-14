// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import { AuthenticationType } from 'azure-maps-control';

export const environment = {
  production: false,
  socketEndpoint: "http://localhost:3000",
  backendApiUrl: "http://localhost:3000/api",
  azureMapAuthOptions: {
    authType: AuthenticationType.subscriptionKey,
    subscriptionKey: 'XRCgif7kmtqAjBDsYI5p3d-L9mvC7MfkN6G4Cyuckzk'
  }
}
