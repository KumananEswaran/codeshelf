"use client";

import { createContext, useContext, useCallback, useState } from "react";
import { type EditorPreferences, EDITOR_DEFAULTS } from "@/types/editor";
import { saveEditorPreferences } from "@/actions/editor-preferences";
import { toast } from "sonner";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  updatePreferences: (updates: Partial<EditorPreferences>) => void;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue>({
  preferences: EDITOR_DEFAULTS,
  updatePreferences: () => {},
});

export function EditorPreferencesProvider({
  children,
  initialPreferences,
}: {
  children: React.ReactNode;
  initialPreferences: EditorPreferences;
}) {
  const [preferences, setPreferences] = useState<EditorPreferences>(initialPreferences);

  const updatePreferences = useCallback(
    (updates: Partial<EditorPreferences>) => {
      const next = { ...preferences, ...updates };
      setPreferences(next);

      saveEditorPreferences(next).then((result) => {
        if (result.success) {
          toast.success("Editor preferences saved");
        } else {
          toast.error(result.error ?? "Failed to save preferences");
          setPreferences(preferences);
        }
      });
    },
    [preferences]
  );

  return (
    <EditorPreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences() {
  return useContext(EditorPreferencesContext);
}
