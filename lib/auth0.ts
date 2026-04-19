import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  session: {
    rolling: true,
    inactivityDuration: 24 * 60 * 60,      // extend session on activity (1 day)
    absoluteDuration: 7 * 24 * 60 * 60,    // 7-day hard cap
  },
  authorizationParameters: {
    scope: "openid profile email offline_access",
    // Require MFA for every login to protect financial data
    acr_values: "http://schemas.openid.net/pape/policies/2007/06/multi-factor",
  },
});
