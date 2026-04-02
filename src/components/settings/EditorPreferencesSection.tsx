"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEditorPreferences } from "@/contexts/EditorPreferencesContext";
import { FONT_SIZE_OPTIONS, TAB_SIZE_OPTIONS, THEME_OPTIONS } from "@/types/editor";

export default function EditorPreferencesSection() {
  const { preferences, updatePreferences } = useEditorPreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font Size */}
        <div className="flex items-center justify-between">
          <Label htmlFor="font-size">Font Size</Label>
          <Select
            value={String(preferences.fontSize)}
            onValueChange={(v) => updatePreferences({ fontSize: Number(v) })}
          >
            <SelectTrigger id="font-size" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab Size */}
        <div className="flex items-center justify-between">
          <Label htmlFor="tab-size">Tab Size</Label>
          <Select
            value={String(preferences.tabSize)}
            onValueChange={(v) => updatePreferences({ tabSize: Number(v) })}
          >
            <SelectTrigger id="tab-size" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAB_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} spaces
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between">
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={preferences.theme}
            onValueChange={(v) => v && updatePreferences({ theme: v })}
          >
            <SelectTrigger id="theme" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEME_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Word Wrap */}
        <div className="flex items-center justify-between">
          <Label htmlFor="word-wrap">Word Wrap</Label>
          <Switch
            id="word-wrap"
            checked={preferences.wordWrap}
            onCheckedChange={(v) => updatePreferences({ wordWrap: v })}
          />
        </div>

        {/* Minimap */}
        <div className="flex items-center justify-between">
          <Label htmlFor="minimap">Minimap</Label>
          <Switch
            id="minimap"
            checked={preferences.minimap}
            onCheckedChange={(v) => updatePreferences({ minimap: v })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
