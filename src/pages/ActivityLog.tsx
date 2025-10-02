import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: 'create' | 'update' | 'delete' | 'login' | 'logout';
  entity_type: 'booking' | 'equipment' | 'project' | 'user' | 'usage_record' | 'profile';
  entity_id: string | null;
  entity_name: string | null;
  changes: any;
  metadata: any;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    spirit_animal: string | null;
  };
}

const ActivityLog = () => {
  const { permissions } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const canViewAllLogs = permissions.canViewAnalytics; // PI, Post-Doc, Grad Students can view all logs

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            spirit_animal
          )
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter as 'create' | 'update' | 'delete' | 'login' | 'logout');
      }

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter as 'booking' | 'equipment' | 'project' | 'user' | 'usage_record' | 'profile');
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Email', 'Action', 'Entity Type', 'Entity Name'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.profiles?.full_name || 'Unknown',
      log.profiles?.email || '',
      log.action_type,
      log.entity_type,
      log.entity_name || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.entity_name?.toLowerCase().includes(search) ||
      log.profiles?.full_name?.toLowerCase().includes(search) ||
      log.profiles?.email?.toLowerCase().includes(search)
    );
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create': return 'default';
      case 'update': return 'secondary';
      case 'delete': return 'destructive';
      default: return 'outline';
    }
  };

  const getEntityLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      booking: 'Booking',
      equipment: 'Equipment',
      project: 'Project',
      user: 'User',
      usage_record: 'Usage Record',
      profile: 'Profile'
    };
    return labels[entityType] || entityType;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Activity Log</h1>
              <p className="text-muted-foreground mt-1">
                {canViewAllLogs ? 'Complete audit trail of all system activities' : 'Your activity history'}
              </p>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by entity name, user name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-full lg:w-[180px]">
                    <SelectValue placeholder="Action Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-full lg:w-[180px]">
                    <SelectValue placeholder="Entity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="booking">Bookings</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="project">Projects</SelectItem>
                    <SelectItem value="usage_record">Usage Records</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="profile">Profiles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No activity logs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getActionBadgeVariant(log.action_type)} className="uppercase text-xs">
                            {log.action_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getEntityLabel(log.entity_type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {log.profiles?.full_name || 'Unknown User'}
                          </span>
                          {log.profiles?.spirit_animal && (
                            <span className="text-lg" title={log.profiles.spirit_animal}>
                              {log.profiles.spirit_animal}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground truncate">
                            ({log.profiles?.email})
                          </span>
                        </div>
                        {log.entity_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.action_type === 'create' && 'Created'}
                            {log.action_type === 'update' && 'Updated'}
                            {log.action_type === 'delete' && 'Deleted'}: {log.entity_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && filteredLogs.length >= ITEMS_PER_PAGE && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {page}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => p + 1)}
                    disabled={filteredLogs.length < ITEMS_PER_PAGE}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ActivityLog;