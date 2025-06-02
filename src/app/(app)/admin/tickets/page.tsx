
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTicketsForAdmin, type Ticket } from '@/actions/ticketActions';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, RotateCcw, Inbox, Badge } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

export default function AdminTicketsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTickets = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    setError(null);
    const result = await getTicketsForAdmin(user.uid);
    if (result.success && result.tickets) {
      setTickets(result.tickets);
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

  const paginatedTickets = tickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(tickets.length / ITEMS_PER_PAGE);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-destructive">
        <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
        <p>{error}</p>
        <Button onClick={fetchTickets} variant="outline" className="mt-4">
          <RotateCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }
  
  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-300';
      case 'Closed': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
          <Inbox className="h-7 w-7" /> Ticket System
        </CardTitle>
        <CardDescription>
          View and manage user-submitted tickets. Total tickets: {tickets.length}.
          {userProfile?.role === 'manager' && " (Read-only access for managers)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <Alert>
            <Inbox className="h-4 w-4" />
            <AlertTitle>No Tickets Yet!</AlertTitle>
            <AlertDescription>
              There are no support tickets in the system.
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
                    <TableHead className="text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-xs truncate w-[100px] max-w-[100px]">
                        <Link href={`#`} passHref>
                           <span className="hover:underline cursor-pointer" title="View Ticket Details (Coming Soon)">{ticket.id.substring(0,8)}...</span>
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium truncate max-w-xs">{ticket.title}</TableCell>
                      <TableCell>
                        {ticket.isAnonymous ? 'Anonymous' : (
                          <div className="flex flex-col">
                            <span className="truncate max-w-[150px]">{ticket.userDisplayName || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">{ticket.userEmail}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{ticket.category}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn("px-2 py-0.5 text-xs rounded-full border font-medium", getStatusColor(ticket.status))}>
                          {ticket.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {/* Dates are now ISO strings, parse them for formatting */}
                        {format(new Date(ticket.createdAt), 'MMM d, yyyy, HH:mm')}
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
            <p className="text-xs text-muted-foreground mt-4 text-center">Ticket detail view and management actions (comments, status changes) coming soon.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
