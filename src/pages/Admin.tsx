import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  useAdminStats, 
  useAdminUsers, 
  useAdminReports, 
  useUpdateReportStatus,
  useIsAdmin
} from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  TrendingUp,
  Loader2,
  Shield,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { Navigate } from 'react-router-dom';

const Admin = () => {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: reports, isLoading: reportsLoading } = useAdminReports();
  const updateReportStatus = useUpdateReportStatus();

  if (adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/chat" replace />;
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
  };

  const handleResolveReport = async (id: string) => {
    await updateReportStatus.mutateAsync({ id, status: 'resolved' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 pb-20">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage users, view analytics, and handle reports</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats?.users || 0}
              icon={<Users className="h-5 w-5" />}
              loading={statsLoading}
            />
            <StatCard
              title="Messages"
              value={stats?.messages || 0}
              icon={<MessageSquare className="h-5 w-5" />}
              loading={statsLoading}
            />
            <StatCard
              title="Conversations"
              value={stats?.conversations || 0}
              icon={<TrendingUp className="h-5 w-5" />}
              loading={statsLoading}
            />
            <StatCard
              title="Pending Reports"
              value={stats?.pendingReports || 0}
              icon={<AlertTriangle className="h-5 w-5" />}
              loading={statsLoading}
              highlight={stats?.pendingReports ? stats.pendingReports > 0 : false}
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage all registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {users?.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between rounded-lg border border-border p-4"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(user.username)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.username || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">
                                  Joined {format(new Date(user.created_at || ''), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {user.is_online ? (
                                <Badge variant="default" className="bg-online-indicator">Online</Badge>
                              ) : (
                                <Badge variant="secondary">Offline</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Chat Reports</CardTitle>
                  <CardDescription>Review and handle user reports</CardDescription>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : reports?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="font-medium">No reports</p>
                      <p className="text-sm text-muted-foreground">
                        All clear! No reports to review.
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {reports?.map((report) => (
                          <div
                            key={report.id}
                            className="rounded-lg border border-border p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium">{report.reason}</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Reported on {format(new Date(report.created_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {report.status === 'pending' ? (
                                  <>
                                    <Badge variant="outline" className="gap-1">
                                      <Clock className="h-3 w-3" />
                                      Pending
                                    </Badge>
                                    <Button
                                      size="sm"
                                      onClick={() => handleResolveReport(report.id)}
                                      disabled={updateReportStatus.isPending}
                                    >
                                      Resolve
                                    </Button>
                                  </>
                                ) : (
                                  <Badge variant="default" className="gap-1 bg-online-indicator">
                                    <CheckCircle className="h-3 w-3" />
                                    Resolved
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>Platform usage statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-border p-6">
                      <p className="text-sm text-muted-foreground">Average Messages/User</p>
                      <p className="mt-2 text-3xl font-bold">
                        {stats && stats.users > 0
                          ? (stats.messages / stats.users).toFixed(1)
                          : '0'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-6">
                      <p className="text-sm text-muted-foreground">Active Conversations</p>
                      <p className="mt-2 text-3xl font-bold">{stats?.conversations || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
  highlight?: boolean;
}

const StatCard = ({ title, value, icon, loading, highlight }: StatCardProps) => (
  <Card className={highlight ? 'border-destructive/50' : ''}>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Loader2 className="mt-2 h-6 w-6 animate-spin" />
          ) : (
            <p className="mt-2 text-3xl font-bold">{value.toLocaleString()}</p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${highlight ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default Admin;
