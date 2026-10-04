import React, { createContext, type ReactNode, useContext } from "react";

const translations = {
  en: {
    "common.dashboard": "Dashboard",
    "common.logout": "Logout",
    "common.login": "Login",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.create": "Create",
    "common.search": "Search",
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.success": "Operation successful",
    "common.actions": "Actions",
    "common.unexpectedError": "An unexpected error occurred",
    "table.deleteFailed": "Delete failed",
    "tabs.recordCreated": "Record created successfully",
    "tabs.recordUpdated": "Record updated successfully",
    "tabs.recordDeleted": "Record deleted successfully",
    "tabs.createFailed": "Failed to create",
    "tabs.updateFailed": "Failed to update",
    "tabs.deleteFailed": "Failed to delete",
    "tabs.loading": "Loading",
    "tabs.loadFailed": "Failed to load",
    "form.createSuccess": "{entity} created successfully",
    "form.updateSuccess": "{entity} updated successfully",
    "form.createFailed": "Failed to create {entity}",
    "form.updateFailed": "Failed to update {entity}",
    "form.deleteFailed": "Delete failed",
    "conflict.title": "This record was changed while you were editing it",
    "conflict.titleFinal": "This record is closed",
    "conflict.anotherUser": "another user",
    "conflict.wasChangedBy": "was changed by",
    "conflict.at": "at",
    "conflict.isClosed": "is in a final state",
    "conflict.status": "Status",
    "conflict.transactionComplete": "this transaction is complete",
    "conflict.comparison": "Your values beside the values now saved",
    "conflict.field": "Field",
    "conflict.yours": "Yours",
    "conflict.theirs": "Saved now",
    "conflict.finalExplained": "A record in a final state cannot be changed. Refresh to see it as it now stands.",
    "conflict.refresh": "Refresh to latest",
    "conflict.overwrite": "Overwrite with my changes",
    "conflict.saved": "Saved",
    "conflict.savedStatus": "Status",
  },
};

interface TranslationContextType {
  t: (key: string) => string;
  locale: string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
  locale?: string;
}

export function TranslationProvider({ children, locale = "en" }: TranslationProviderProps) {
  const t = (key: string): string => {
    const dict = translations[locale as keyof typeof translations] || translations.en;
    return (dict as Record<string, string>)[key] || key;
  };

  return (
    <TranslationContext.Provider value={{ t, locale }}>{children}</TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return context;
}

export function translate(key: string, locale = "en"): string {
  const dict = translations[locale as keyof typeof translations] || translations.en;
  return (dict as Record<string, string>)[key] || key;
}

export const useTranslations = useTranslation;
