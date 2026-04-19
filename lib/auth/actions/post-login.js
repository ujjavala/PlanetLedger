/**
 * Auth0 Post-Login Action for PlanetLedger
 *
 * DEPLOY IN AUTH0 DASHBOARD:
 *   Actions > Library > Create Action > select "Login / Post Login"
 *   Paste this file, click Deploy, then add to the Login flow.
 *
 * What this does:
 *  1. First-login provisioning: sets default eco tier + preferences in app_metadata
 *  2. Injects custom namespace claims into the ID token for agent context
 *  3. Sets organization context if the user belongs to an Auth0 org
 *  4. Enforces MFA — users without a completed MFA step are prompted before proceeding
 */

exports.onExecutePostLogin = async (event, api) => {
  const ns = "https://planetledger/";

  // ── 1. First-login provisioning ─────────────────────────────────────────────
  if (!event.user.app_metadata?.planetledger_provisioned) {
    api.user.setAppMetadata("planetledger_provisioned", true);
    api.user.setAppMetadata("eco_tier", "starter");
    api.user.setAppMetadata("noCarOwnership", false);
    api.user.setAppMetadata("lowIncomeMode", false);
  }

  // ── 2. Custom claims for agent context ──────────────────────────────────────
  api.idToken.setCustomClaim(`${ns}preferences`, {
    noCarOwnership:  event.user.app_metadata?.noCarOwnership  ?? false,
    lowIncomeMode:   event.user.app_metadata?.lowIncomeMode   ?? false,
  });

  api.idToken.setCustomClaim(`${ns}scopes`, [
    "read:transactions",
    "write:insights",
    "update:score",
  ]);

  api.idToken.setCustomClaim(`${ns}eco_tier`, event.user.app_metadata?.eco_tier ?? "starter");

  // ── 3. Organization context ──────────────────────────────────────────────────
  if (event.organization) {
    api.idToken.setCustomClaim(`${ns}organization_id`,   event.organization.id);
    api.idToken.setCustomClaim(`${ns}organization_name`, event.organization.display_name);
  }

  // ── 4. MFA enforcement for financial data ────────────────────────────────────
  const hasMfa = event.authentication?.methods?.some((m) => m.name === "mfa");
  if (hasMfa) {
    api.idToken.setCustomClaim(`${ns}mfa_verified`, true);
  } else {
    // Prompt MFA — browser-trust allowed after first verification
    api.multifactor.enable("any", { allowRememberBrowser: true });
  }
};
