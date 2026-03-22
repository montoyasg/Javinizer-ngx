import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { historyApi, type HistoryRecord } from "@/lib/api";

const DISPLAY_COLUMNS = [
  "Timestamp",
  "Id",
  "DisplayName",
  "Title",
  "Maker",
  "Label",
  "Actress",
  "Genre",
  "ReleaseDate",
  "Path",
];

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await historyApi.get();
      // Sort by timestamp descending
      data.sort((a, b) => (b.Timestamp || "").localeCompare(a.Timestamp || ""));
      setHistory(data);
    } catch (e) {
      toast.error(`Failed to load history: ${e instanceof Error ? e.message : e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClear = async () => {
    try {
      await historyApi.clear();
      setHistory([]);
      setConfirmClear(false);
      toast.success("History cleared");
    } catch (e) {
      toast.error(`Failed to clear: ${e instanceof Error ? e.message : e}`);
    }
  };

  const filtered = useMemo(() => {
    if (!filter) return history;
    const q = filter.toLowerCase();
    return history.filter((row) =>
      Object.values(row).some((v) => v && v.toLowerCase().includes(q))
    );
  }, [history, filter]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">History</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadHistory} disabled={loading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reload
          </Button>
          <Button variant="destructive" onClick={() => setConfirmClear(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{filtered.length} records</span>
            <Input
              className="w-72"
              placeholder="Search history..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {DISPLAY_COLUMNS.map((col) => (
                      <TableHead key={col} className="whitespace-nowrap">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row, i) => (
                    <TableRow key={i}>
                      {DISPLAY_COLUMNS.map((col) => (
                        <TableCell
                          key={col}
                          className="max-w-[200px] truncate text-xs"
                          title={row[col] || ""}
                        >
                          {row[col] || ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={DISPLAY_COLUMNS.length} className="text-center text-muted-foreground">
                        No history records
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Confirm clear dialog */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear history?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will remove all sort history records.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClear(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClear}>Clear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
