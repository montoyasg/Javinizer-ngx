import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Check, RotateCcw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { settingsApi } from "@/lib/api";
import type { Settings } from "@/types";

const SCRAPERS = [
  { key: "scraper.movie.r18dev", label: "R18.dev" },
  { key: "scraper.movie.dmmja", label: "DMM (Ja)" },
  { key: "scraper.movie.dmm", label: "DMM" },
  { key: "scraper.movie.javlibrary", label: "Javlibrary" },
  { key: "scraper.movie.javlibraryja", label: "Javlibrary (Ja)" },
  { key: "scraper.movie.javlibraryzh", label: "Javlibrary (Zh)" },
  { key: "scraper.movie.javbus", label: "Javbus" },
  { key: "scraper.movie.javbusja", label: "Javbus (Ja)" },
  { key: "scraper.movie.javbuszh", label: "Javbus (Zh)" },
  { key: "scraper.movie.javdb", label: "JavDB" },
  { key: "scraper.movie.javdbzh", label: "JavDB (Zh)" },
  { key: "scraper.movie.jav321ja", label: "Jav321 (Ja)" },
  { key: "scraper.movie.mgstageja", label: "MGStage (Ja)" },
  { key: "scraper.movie.aventertainment", label: "AVEntertainment" },
  { key: "scraper.movie.aventertainmentja", label: "AVEntertainment (Ja)" },
  { key: "scraper.movie.tokyohot", label: "TokyoHot" },
  { key: "scraper.movie.tokyohotja", label: "TokyoHot (Ja)" },
  { key: "scraper.movie.tokyohotzh", label: "TokyoHot (Zh)" },
];

const LOCATIONS = [
  { key: "location.input", label: "Input" },
  { key: "location.output", label: "Output" },
  { key: "location.thumbcsv", label: "Thumb CSV" },
  { key: "location.genrecsv", label: "Genre CSV" },
  { key: "location.uncensorcsv", label: "Uncensor CSV" },
  { key: "location.historycsv", label: "History CSV" },
  { key: "location.tagcsv", label: "Tag CSV" },
  { key: "location.log", label: "Log" },
];

const SORT_BOOLEANS = [
  { key: "sort.movetofolder", label: "Move to folder" },
  { key: "sort.renamefile", label: "Rename file" },
  { key: "sort.create.nfo", label: "Create NFO" },
  { key: "sort.create.nfoperfile", label: "NFO per file" },
  { key: "sort.download.actressimg", label: "Download actress images" },
  { key: "sort.download.thumbimg", label: "Download thumb image" },
  { key: "sort.download.posterimg", label: "Download poster image" },
  { key: "sort.download.screenshotimg", label: "Download screenshots" },
  { key: "sort.download.trailervid", label: "Download trailer" },
  { key: "sort.format.groupactress", label: "Group actress names" },
  { key: "sort.metadata.nfo.mediainfo", label: "Include MediaInfo" },
  { key: "sort.metadata.nfo.firstnameorder", label: "First name order" },
  { key: "sort.metadata.nfo.actresslanguageja", label: "Actress name in Japanese" },
  { key: "sort.metadata.nfo.unknownactress", label: "Include unknown actress" },
  { key: "sort.metadata.nfo.originalpath", label: "Include original path" },
  { key: "sort.metadata.thumbcsv", label: "Use thumb CSV" },
  { key: "sort.metadata.thumbcsv.autoadd", label: "Auto-add to thumb CSV" },
  { key: "sort.metadata.thumbcsv.convertalias", label: "Convert alias" },
  { key: "sort.metadata.genrecsv", label: "Use genre CSV" },
];

const FORMAT_STRINGS = [
  { key: "sort.format.delimiter", label: "Delimiter" },
  { key: "sort.format.file", label: "File" },
  { key: "sort.format.folder", label: "Folder" },
  { key: "sort.format.outputfolder", label: "Output Folder" },
  { key: "sort.format.thumbimg", label: "Thumb Image" },
  { key: "sort.format.nfo", label: "NFO" },
  { key: "sort.format.screenshotimg", label: "Screenshot Image" },
  { key: "sort.format.screenshotfolder", label: "Screenshot Folder" },
  { key: "sort.format.actressimgfolder", label: "Actress Image Folder" },
  { key: "sort.metadata.nfo.displayname", label: "Display Name" },
];

const PRIORITY_FIELDS = [
  "actress", "alternatetitle", "coverurl", "description", "director",
  "genre", "id", "contentid", "label", "maker", "rating",
  "releasedate", "runtime", "series", "screenshoturl", "title", "trailerurl",
];

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const [jsonContent, setJsonContent] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await settingsApi.get()) as Settings;
      setSettings(data);
    } catch (e) {
      toast.error(`Failed to load settings: ${e instanceof Error ? e.message : e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsApi.update(settings);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(`Failed to save: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const updateSetting = (key: string, value: unknown) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const openJsonEditor = async () => {
    try {
      const { content } = await settingsApi.getRaw();
      setJsonContent(content);
      setJsonEditorOpen(true);
    } catch (e) {
      toast.error(`Failed to load raw settings: ${e instanceof Error ? e.message : e}`);
    }
  };

  const saveJsonEditor = async () => {
    try {
      await settingsApi.updateRaw(jsonContent);
      toast.success("Settings saved");
      setJsonEditorOpen(false);
      loadSettings();
    } catch (e) {
      toast.error(`Invalid JSON: ${e instanceof Error ? e.message : e}`);
    }
  };

  if (loading || !settings) {
    return <div className="p-6 text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Settings</h2>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Check className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Apply"}
          </Button>
          <Button variant="secondary" onClick={openJsonEditor}>
            <FileText className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button variant="outline" onClick={loadSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reload
          </Button>
        </div>
      </div>

      <Tabs defaultValue="scrapers">
        <TabsList>
          <TabsTrigger value="scrapers">Scrapers</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="sort">Sort Options</TabsTrigger>
          <TabsTrigger value="format">Format Strings</TabsTrigger>
          <TabsTrigger value="priority">Priorities</TabsTrigger>
          <TabsTrigger value="emby">Emby</TabsTrigger>
        </TabsList>

        <TabsContent value="scrapers">
          <Card>
            <CardHeader>
              <CardTitle>Movie Scrapers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SCRAPERS.map((s) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <Checkbox
                      id={s.key}
                      checked={settings[s.key] as boolean}
                      onCheckedChange={(v) => updateSetting(s.key, v === true)}
                    />
                    <Label htmlFor={s.key} className="text-sm">{s.label}</Label>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="scraper.option.dmm.scrapeactress"
                    checked={settings["scraper.option.dmm.scrapeactress"] as boolean}
                    onCheckedChange={(v) => updateSetting("scraper.option.dmm.scrapeactress", v === true)}
                  />
                  <Label htmlFor="scraper.option.dmm.scrapeactress">DMM scrape actress</Label>
                </div>
                <div className="grid grid-cols-[200px_1fr] gap-2 items-center">
                  <Label>Throttle Limit</Label>
                  <Input
                    type="number"
                    className="w-24"
                    value={settings.throttlelimit as number}
                    onChange={(e) => updateSetting("throttlelimit", Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-[200px_1fr] gap-2 items-center">
                  <Label>ID Preference</Label>
                  <Input
                    className="w-48"
                    value={settings["scraper.option.idpreference"] as string}
                    onChange={(e) => updateSetting("scraper.option.idpreference", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>File Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {LOCATIONS.map((loc) => (
                <div key={loc.key} className="grid grid-cols-[140px_1fr] gap-2 items-center">
                  <Label>{loc.label}</Label>
                  <Input
                    value={(settings[loc.key] as string) || ""}
                    onChange={(e) => updateSetting(loc.key, e.target.value)}
                    placeholder={`Path to ${loc.label.toLowerCase()}...`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sort">
          <Card>
            <CardHeader>
              <CardTitle>Sort Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SORT_BOOLEANS.map((opt) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <Checkbox
                      id={opt.key}
                      checked={settings[opt.key] as boolean}
                      onCheckedChange={(v) => updateSetting(opt.key, v === true)}
                    />
                    <Label htmlFor={opt.key} className="text-sm">{opt.label}</Label>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="grid grid-cols-[200px_1fr] gap-2 items-center">
                  <Label>Max Title Length</Label>
                  <Input
                    type="number"
                    className="w-24"
                    value={settings["sort.maxtitlelength"] as number}
                    onChange={(e) => updateSetting("sort.maxtitlelength", Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-[200px_1fr] gap-2 items-center">
                  <Label>Min File Size (MB)</Label>
                  <Input
                    type="number"
                    className="w-24"
                    value={settings["match.minimumfilesize"] as number}
                    onChange={(e) => updateSetting("match.minimumfilesize", Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="format">
          <Card>
            <CardHeader>
              <CardTitle>Format Strings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {FORMAT_STRINGS.map((fmt) => (
                <div key={fmt.key} className="grid grid-cols-[180px_1fr] gap-2 items-center">
                  <Label>{fmt.label}</Label>
                  <Input
                    value={
                      Array.isArray(settings[fmt.key])
                        ? (settings[fmt.key] as string[]).join(", ")
                        : (settings[fmt.key] as string) || ""
                    }
                    onChange={(e) => updateSetting(fmt.key, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority">
          <Card>
            <CardHeader>
              <CardTitle>Metadata Priorities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Comma-separated scraper names in priority order (highest first).
              </p>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {PRIORITY_FIELDS.map((field) => {
                    const key = `sort.metadata.priority.${field}`;
                    const value = settings[key];
                    return (
                      <div key={field} className="grid grid-cols-[160px_1fr] gap-2 items-center">
                        <Label className="capitalize">{field}</Label>
                        <Input
                          value={Array.isArray(value) ? (value as string[]).join(", ") : ""}
                          onChange={(e) =>
                            updateSetting(
                              key,
                              e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emby">
          <Card>
            <CardHeader>
              <CardTitle>Emby / Jellyfin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                <Label>URL</Label>
                <Input
                  value={(settings["emby.url"] as string) || ""}
                  onChange={(e) => updateSetting("emby.url", e.target.value)}
                  placeholder="http://192.168.0.1:8096"
                />
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
                <Label>API Key</Label>
                <Input
                  value={(settings["emby.apikey"] as string) || ""}
                  onChange={(e) => updateSetting("emby.apikey", e.target.value)}
                  placeholder="Your API key"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* JSON Editor Dialog */}
      <Dialog open={jsonEditorOpen} onOpenChange={setJsonEditorOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>jvSettings.json</DialogTitle>
          </DialogHeader>
          <Textarea
            className="flex-1 font-mono text-xs h-full min-h-[60vh] resize-none"
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setJsonEditorOpen(false)}>Cancel</Button>
            <Button onClick={saveJsonEditor}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
