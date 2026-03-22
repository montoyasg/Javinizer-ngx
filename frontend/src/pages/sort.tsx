import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, Play, FastForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { sortApi, type ScanResult } from "@/lib/api";

export function SortPage() {
  const [path, setPath] = useState("");
  const [manualId, setManualId] = useState("");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ show: false, completed: 0, total: 0 });

  // Sort options
  const [recurse, setRecurse] = useState(false);
  const [strict, setStrict] = useState(false);
  const [update, setUpdate] = useState(false);
  const [force, setForce] = useState(false);

  const handleScan = useCallback(async () => {
    if (!path.trim()) {
      toast.error("Enter a file or directory path");
      return;
    }
    setLoading(true);
    try {
      const data = await sortApi.scan(path, recurse, strict);
      setResults(data);
      setCurrentIndex(0);
      if (data.length === 0) {
        toast.warning("No movies matched");
      } else {
        toast.success(`Found ${data.length} result(s)`);
      }
    } catch (e) {
      toast.error(`Scan failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setLoading(false);
    }
  }, [path, recurse, strict]);

  const handleManualSearch = useCallback(async () => {
    if (!manualId.trim()) return;
    setLoading(true);
    try {
      const data = await sortApi.search(manualId);
      if (data) {
        setResults([{ Data: data as ScanResult["Data"] }]);
        setCurrentIndex(0);
        toast.success("Search completed");
      } else {
        toast.warning(`No results for ${manualId}`);
      }
    } catch (e) {
      toast.error(`Search failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setLoading(false);
    }
  }, [manualId]);

  const handleSortSingle = useCallback(async () => {
    if (!path.trim()) return;
    setSorting(true);
    try {
      await sortApi.execute({ path, strict, update, force });
      toast.success("Sort completed");
    } catch (e) {
      toast.error(`Sort failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSorting(false);
    }
  }, [path, strict, update, force]);

  const handleSortBatch = useCallback(async () => {
    if (!path.trim()) return;
    setBatchProgress({ show: true, completed: 0, total: results.length || 1 });
    try {
      const { job_id } = await sortApi.batch({ path, recurse, strict, update, force });
      // Poll for progress
      const poll = setInterval(async () => {
        try {
          const status = await sortApi.jobStatus(job_id);
          setBatchProgress((p) => ({ ...p, completed: status.completed, total: status.total || p.total }));
          if (status.status === "completed") {
            clearInterval(poll);
            setBatchProgress((p) => ({ ...p, show: false }));
            toast.success("Batch sort completed");
          } else if (status.status === "failed") {
            clearInterval(poll);
            setBatchProgress((p) => ({ ...p, show: false }));
            toast.error(`Batch sort failed: ${status.error}`);
          }
        } catch {
          clearInterval(poll);
          setBatchProgress((p) => ({ ...p, show: false }));
        }
      }, 2000);
    } catch (e) {
      setBatchProgress((p) => ({ ...p, show: false }));
      toast.error(`Batch sort failed: ${e instanceof Error ? e.message : e}`);
    }
  }, [path, recurse, strict, update, force, results.length]);

  const current = results[currentIndex] ?? null;
  const movieData = current?.Data as Record<string, unknown> | null;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Sort</h2>

      {/* Search bar */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter file or directory path..."
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="flex-1"
            />
            <Button onClick={handleScan} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Scanning..." : "Search"}
            </Button>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Recurse", checked: recurse, set: setRecurse },
              { label: "Strict", checked: strict, set: setStrict },
              { label: "Update", checked: update, set: setUpdate },
              { label: "Force", checked: force, set: setForce },
            ].map((opt) => (
              <div key={opt.label} className="flex items-center gap-2">
                <Checkbox
                  id={`opt-${opt.label}`}
                  checked={opt.checked}
                  onCheckedChange={(v) => opt.set(v === true)}
                />
                <Label htmlFor={`opt-${opt.label}`} className="text-sm">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>

          {/* Manual search */}
          <div className="flex gap-2">
            <Input
              placeholder="Manual search by ID (e.g. ABC-123)"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
            />
            <Button variant="secondary" onClick={handleManualSearch} disabled={loading}>
              Search ID
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cover image */}
          <Card>
            <CardContent className="pt-6 flex items-center justify-center">
              {movieData?.CoverUrl ? (
                <img
                  src={movieData.CoverUrl as string}
                  alt={movieData.Title as string}
                  className="max-h-96 rounded-md object-contain"
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No cover image
                </div>
              )}
            </CardContent>
          </Card>

          {/* Movie details */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {movieData?.Id as string || "No data"}{" "}
                <Badge variant="secondary" className="ml-2">
                  {currentIndex + 1} / {results.length}
                </Badge>
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => i - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentIndex >= results.length - 1}
                  onClick={() => setCurrentIndex((i) => i + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-8 mx-1" />
                <Button size="icon" onClick={handleSortSingle} disabled={sorting} title="Sort current">
                  <Play className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" onClick={handleSortBatch} title="Sort all">
                  <FastForward className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setResults([]);
                    setCurrentIndex(0);
                  }}
                  title="Clear results"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {movieData ? (
                <ScrollArea className="h-80">
                  <div className="space-y-2 text-sm">
                    {[
                      ["Title", movieData.Title],
                      ["Alternate Title", movieData.AlternateTitle],
                      ["Release Date", movieData.ReleaseDate],
                      ["Runtime", movieData.Runtime ? `${movieData.Runtime} min` : null],
                      ["Director", movieData.Director],
                      ["Maker", movieData.Maker],
                      ["Label", movieData.Label],
                      ["Series", movieData.Series],
                      ["Rating", movieData.Rating],
                      ["Content ID", movieData.ContentId],
                    ]
                      .filter(([, v]) => v)
                      .map(([label, value]) => (
                        <div key={label as string} className="grid grid-cols-[140px_1fr] gap-2">
                          <span className="font-medium text-muted-foreground">{label as string}</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}

                    {/* Actress */}
                    {Array.isArray(movieData.Actress) && (movieData.Actress as unknown[]).length > 0 ? (
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <span className="font-medium text-muted-foreground">Actress</span>
                        <div className="flex flex-wrap gap-1">
                          {(movieData.Actress as { LastName: string; FirstName: string; JapaneseName: string }[]).map((a, i) => (
                            <Badge key={i} variant="outline">
                              {a.LastName} {a.FirstName} {a.JapaneseName ? `(${a.JapaneseName})` : ""}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Genre */}
                    {Array.isArray(movieData.Genre) && (movieData.Genre as string[]).length > 0 ? (
                      <div className="grid grid-cols-[140px_1fr] gap-2">
                        <span className="font-medium text-muted-foreground">Genre</span>
                        <div className="flex flex-wrap gap-1">
                          {(movieData.Genre as string[]).map((g, i) => (
                            <Badge key={i} variant="secondary">{String(g)}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Description */}
                    {typeof movieData.Description === "string" && movieData.Description ? (
                      <div className="pt-2">
                        <span className="font-medium text-muted-foreground">Description</span>
                        <p className="mt-1 text-muted-foreground leading-relaxed">
                          {movieData.Description}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground">No data available for this result.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Batch progress dialog */}
      <Dialog open={batchProgress.show} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batch Sort Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Progress
              value={batchProgress.total > 0 ? (batchProgress.completed / batchProgress.total) * 100 : 0}
            />
            <p className="text-center text-lg font-medium">
              {batchProgress.completed} / {batchProgress.total}
            </p>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setBatchProgress((p) => ({ ...p, show: false }))}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
