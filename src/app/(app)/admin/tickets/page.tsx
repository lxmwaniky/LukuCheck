
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTicketsForAdmin, type Ticket, type TicketStatus } from '@/actions/ticketActions';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, RotateCcw, Inbox, Filter, CalendarDays } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

const ITEMS_PER_PAGE = 10;

export default function AdminTicketsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);

  const fetchTickets = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    setError(null);
    const result = await getTicketsForAdmin(user.uid);
    if (result.success && result.tickets) {
      setAllTickets(result.tickets);
    } else {
      setError(result.error || "Failed to load tickets.");
    }
    setIsLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userProfile?.role || !['admin', 'manager'].includes(userProfile.role)) {
        router.replace('/login?redirect=/admin/tickets'); 
      } else {
        fetchTickets();
      }
    }
  }, [user, userProfile, authLoading, router, fetchTickets]);

  const filteredTickets = useMemo(() => {
    return allTickets.filter(ticket => {
      const ticketCreatedAt = new Date(ticket.createdAt);
      const statusMatch = statusFilter === 'all' || ticket.status === statusFilter;
      const startDateMatch = !startDateFilter || ticketCreatedAt >= startOfDay(startDateFilter);
      const endDateMatch = !endDateFilter || ticketCreatedAt <= endOfDay(endDateFilter);
      return statusMatch && startDateMatch && endDateMatch;
    });
  }, [allTickets, statusFilter, startDateFilter, endDateFilter]);

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);

  const getStatusClass = (status: Ticket['status']) => {
    switch (status) {
      case 'Open': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'In Progress': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
      case 'Resolved': return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
      case 'Closed': return 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  
  const handleClearFilters = () => {
    setStatusFilter('all');
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
    setCurrentPage(1);
  };

  if (authLoading || (isLoading && allTickets.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-xl m-4">
        <CardHeader>
            <CardTitle>Error Loading Tickets</CardTitle>
        </CardHeader>
        <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Loading Failed</AlertTitle>
              <AlertDescription>
                {error}
                <Button onClick={fetchTickets} variant="outline" className="mt-4 ml-2">
                  <RotateCcw className="mr-2 h-4 w-4" /> Retry
                </Button>
              </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
          <Inbox className="h-7 w-7 text-primary" /> Ticket System
        </CardTitle>
        <CardDescription>
          View and manage user-submitted tickets. Displaying {paginatedTickets.length} of {filteredTickets.length} (Total: {allTickets.length}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-semibold mb-3 flex items-center"><Filter className="mr-2 h-5 w-5"/>Filters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                 <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                    <Select value={statusFilter} onValueChange={(value: TicketStatus | 'all') => {setStatusFilter(value); setCurrentPage(1);}}>
                        <SelectTrigger id="status-filter">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <label htmlFor="start-date-filter" className="block text-sm font-medium text-muted-foreground mb-1">Created After</label>
                    <DatePicker date={startDateFilter} setDate={(date) => {setStartDateFilter(date); setCurrentPage(1);}} placeholder="Start Date" className="w-full" />
                 </div>
                 <div>
                    <label htmlFor="end-date-filter" className="block text-sm font-medium text-muted-foreground mb-1">Created Before</label>
                    <DatePicker date={endDateFilter} setDate={(date) => {setEndDateFilter(date); setCurrentPage(1);}} placeholder="End Date" className="w-full" />
                 </div>
                 <Button onClick={handleClearFilters} variant="outline" className="w-full sm:w-auto lg:col-span-3 lg:w-max lg:ml-auto">
                     Clear Filters
                </Button>
            </div>
        </div>

        {filteredTickets.length === 0 && !isLoading ? (
          <Alert>
            <Inbox className="h-4 w-4" />
            <AlertTitle>No Tickets Match Criteria</AlertTitle>
            <AlertDescription>
              No support tickets match your current filter selection. Try adjusting or clearing filters.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Created</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs truncate w-[100px] max-w-[100px]">
                        <Link href={`/admin/tickets/${ticket.id}`} passHref>
                           <span className="text-primary hover:underline cursor-pointer" title="View Ticket Details">{ticket.id.substring(0,8)}...</span>
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium truncate max-w-xs">{ticket.title}</TableCell>
                      <TableCell>
                        {ticket.isAnonymous ? (
                            <span className="italic text-muted-foreground">Anonymous</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="truncate max-w-[150px]">{ticket.userDisplayName || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">{ticket.userEmail}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{ticket.category}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn("px-2.5 py-1 text-xs rounded-full border font-semibold", getStatusClass(ticket.status))}>
                          {ticket.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs hidden sm:table-cell">
                        {format(new Date(ticket.createdAt), 'MMM d, yy HH:mm')}
                      </TableCell>
                       <TableCell className="text-right text-xs">
                        {format(new Date(ticket.updatedAt), 'MMM d, yy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

