import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Users, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { embyApi, type EmbyActor } from "@/lib/api";

export function EmbyPage() {
  const [actors, setActors] = useState<EmbyActor[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingThumbs, setSettingThumbs] = useState(false);
  const [filter, setFilter] = useState("");

  const loadActors = useCallback(async () => {
    setLoading(true);
    try {
      toast.info("Retrieving actors from Emby/Jellyfin...");
      const data = await embyApi.getActors();
      setActors(data);
      toast.success(`Retrieved ${data.length} actors`);
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSetThumbs = useCallback(async () => {
    setSettingThumbs(true);
    try {
      toast.info("Setting actor thumbnails - this may take a while...");
      await embyApi.setThumbs();
      toast.success("Completed setting Emby/Jellyfin thumbs");
    } catch (e) {
      toast.error(`Failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSettingThumbs(false);
    }
  }, []);

  const filtered = filter
    ? actors.filter((a) => a.Name.toLowerCase().includes(filter.toLowerCase()))
    : actors;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Emby / Jellyfin</h2>

      <Card>
        <CardContent className="pt-6 flex gap-2">
          <Button onClick={loadActors} disabled={loading}>
            <Users className="h-4 w-4 mr-2" />
            {loading ? "Loading..." : "View Server Actors"}
          </Button>
          <Button variant="secondary" onClick={handleSetThumbs} disabled={settingThumbs}>
            <Image className="h-4 w-4 mr-2" />
            {settingThumbs ? "Setting..." : "Set Actor Thumbs"}
          </Button>
        </CardContent>
      </Card>

      {actors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Actors ({filtered.length})</span>
              <Input
                className="w-64"
                placeholder="Filter by name..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Thumb</TableHead>
                    <TableHead>Primary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((actor) => (
                    <TableRow key={actor.Id}>
                      <TableCell className="font-medium">{actor.Name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{actor.Id}</TableCell>
                      <TableCell>
                        <Badge variant={actor.Thumb === "Exists" ? "default" : "secondary"}>
                          {actor.Thumb}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={actor.Primary === "Exists" ? "default" : "secondary"}>
                          {actor.Primary}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
