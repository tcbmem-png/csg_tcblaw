// Re-export shim — TN engine relocated to ./states/tn/ (multistate refactor).
// Importers keep using @/lib/calc/* paths; canonical source lives under states/tn/.

export * from "../states/tn/data/constants";
