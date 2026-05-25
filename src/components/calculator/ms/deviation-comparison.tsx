/**
 * Back-compat shim. The on-screen comparison view has been replaced by the
 * richer reconciliation table per MS_Deviation_Worksheet_Build_Brief §
 * "The Reconciliation View". Existing imports of MSDeviationComparison
 * continue to work and now render the new component.
 */
export { MSDeviationReconciliation as MSDeviationComparison } from "./deviation-reconciliation";
