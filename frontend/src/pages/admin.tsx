import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Play, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { adminApi } from "@/lib/api";

export function AdminPage() {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [logContent, setLogContent] = useState("");
  const [logLoading, setLogLoading] = useState(false);
  const [confirmClearLog, setConfirmClearLog] = useState(false);

  const handleRun = useCallback(async () => {
    if (!command.trim()) return;
    setRunning(true);
    try {
      const { output: result } = await adminApi.execute(command);
      setOutput(result);
    } catch (e) {
      setOutput(`Error: ${e instanceof Error ? e.message : e}`);
    } finally {
      setRunning(false);
    }
  }, [command]);

  const loadLog = useCallback(async () => {
    setLogLoading(true);
    try {
      const { content } = await adminApi.getLog();
      setLogContent(content);
    } catch (e) {
      toast.error(`Failed to load log: ${e instanceof Error ? e.message : e}`);
    } finally {
      setLogLoading(false);
    }
  }, []);

  const handleClearLog = async () => {
    try {
      await adminApi.clearLog();
      setLogContent("");
      setConfirmClearLog(false);
      toast.success("Log cleared");
    } catch (e) {
      toast.error(`Failed to clear log: ${e instanceof Error ? e.message : e}`);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Admin</h2>

      {/* Console */}
      <Card>
        <CardHeader>
          <CardTitle>Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Enter a PowerShell command..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRun();
            }}
            rows={3}
            className="font-mono text-sm"
          />
          <Button onClick={handleRun} disabled={running} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            {running ? "Running..." : "Run"}
          </Button>
        </CardContent>
      </Card>

      {/* Console Output */}
      <Card>
        <CardHeader>
          <CardTitle>Console Output</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <pre className="font-mono text-xs whitespace-pre-wrap bg-muted p-4 rounded-md min-h-[200px]">
              {output || "No output"}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Log Viewer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Log</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadLog} disabled={logLoading}>
                <RotateCcw className="h-4 w-4 mr-1" />
                {logLoading ? "Loading..." : "Reload"}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmClearLog(true)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <pre className="font-mono text-xs whitespace-pre-wrap bg-muted p-4 rounded-md min-h-[280px]">
              {logContent || "Click Reload to view log"}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Confirm clear log */}
      <Dialog open={confirmClearLog} onOpenChange={setConfirmClearLog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear log?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClearLog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClearLog}>Clear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
