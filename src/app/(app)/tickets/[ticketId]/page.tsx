
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTicketByIdForAdmin, addCommentToTicketAdmin, updateTicketStatusAdmin, type Ticket, type TicketStatus, type TicketComment } from '@/actions/ticketActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, MessageSquare, Send, CheckCircle, Settings2, User, CalendarDays, Tag, Info, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label'; // Added Label import
import { cn } from '@/lib/utils';

interface AdminTicketDetailPageProps {
  params: { ticketId: string };
}

export default function AdminTicketDetailPage({ params }: AdminTicketDetailPageProps) {
  const { ticketId } = params;
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchTicketDetails = useCallback(async () => {
    if (!user?.uid || !ticketId) return;
    setIsLoading(true);
    setError(null);
    const result = await getTicketByIdForAdmin(user.uid, ticketId);
    if (result.success && result.ticket) {
      setTicket(result.ticket);
    } else {
      setError(result.error || "Failed to load ticket details.");
      setTicket(null);
    }
    setIsLoading(false);
  }, [user?.uid, ticketId]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userProfile?.role || !['admin', 'manager'].includes(userProfile.role)) {
        router.replace('/login?redirect=/admin/tickets');
      } else {
        fetchTicketDetails();
      }
    }
  }, [user, userProfile, authLoading, router, fetchTicketDetails]);

  const handleAddComment = async () => {
    if (!user?.uid || !userProfile || !ticket || !newComment.trim()) {
      toast({ title: "Error", description: "Cannot submit empty comment or user not identified.", variant: "destructive" });
      return;
    }
    setIsSubmittingComment(true);
    const callerName = userProfile.username || (userProfile.role === 'admin' ? 'Admin User' : 'Manager User');
    const result = await addCommentToTicketAdmin(user.uid, ticket.id, newComment.trim(), callerName);
    if (result.success) {
      toast({ title: "Comment Added", description: "Your comment has been posted." });
      setNewComment('');
      fetchTicketDetails(); 
    } else {
      toast({ title: "Error", description: result.error || "Failed to add comment.", variant: "destructive" });
    }
    setIsSubmittingComment(false);
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!user?.uid || !ticket || userProfile?.role !== 'admin') {
      toast({ title: "Error", description: "Status change failed or not authorized.", variant: "destructive" });
      return;
    }
    setIsUpdatingStatus(true);
    const result = await updateTicketStatusAdmin(user.uid, ticket.id, newStatus);
    if (result.success) {
      toast({ title: "Status Updated", description: `Ticket status changed to ${newStatus}.` });
      fetchTicketDetails(); 
    } else {
      toast({ title: "Error", description: result.error || "Failed to update status.", variant: "destructive" });
    }
    setIsUpdatingStatus(false);
  };
  
  const getStatusClass = (status: Ticket['status'] | undefined) => {
    if (!status) return 'bg-muted text-muted-foreground';
    switch (status) {
      case 'Open': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'In Progress': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30';
      case 'Resolved': return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
      case 'Closed': return 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <Card className="shadow-xl m-4">
        <CardHeader>
            <CardTitle>Error Loading Ticket</CardTitle>
        </CardHeader>
        <CardContent>
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Loading Failed</AlertTitle>
              <AlertDescription>
                {error || "Ticket not found or could not be loaded."}
                 <Button onClick={() => router.push('/admin/tickets')} variant="outline" className="mt-4 ml-2">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tickets
                </Button>
              </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button onClick={() => router.push('/admin/tickets')} variant="outline" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Tickets
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-xl sm:text-2xl line-clamp-2">Ticket: {ticket.title}</CardTitle>
             <span className={cn("px-3 py-1.5 text-sm rounded-full border font-semibold whitespace-nowrap", getStatusClass(ticket.status))}>
                {ticket.status}
             </span>
          </div>
          <CardDescription>
            ID: <span className="font-mono text-xs">{ticket.id}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center"><User className="mr-2 h-4 w-4"/>Submitter:</p>
              <p>{ticket.isAnonymous ? <span className="italic">Anonymous</span> : `${ticket.userDisplayName || 'N/A'} (${ticket.userEmail || 'No email'})`}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4"/>Created:</p>
              <p>{format(new Date(ticket.createdAt), 'MMM d, yyyy, HH:mm')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center"><Clock className="mr-2 h-4 w-4"/>Last Updated:</p>
              <p>{format(new Date(ticket.updatedAt), 'MMM d, yyyy, HH:mm')}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4"/>Category:</p>
              <p className="capitalize">{ticket.category}</p>
            </div>
            {ticket.closedAt && (
                 <div className="space-y-1">
                    <p className="text-muted-foreground flex items-center"><CheckCircle className="mr-2 h-4 w-4"/>Closed/Resolved At:</p>
                    <p>{format(new Date(ticket.closedAt), 'MMM d, yyyy, HH:mm')}</p>
                </div>
            )}
          </div>
          
          <Separator />
          <div>
            <h3 className="font-semibold mb-1">Description:</h3>
            <p className="whitespace-pre-wrap bg-muted/30 p-3 rounded-md border">{ticket.description}</p>
          </div>

          {userProfile?.role === 'admin' && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="status" className="font-semibold flex items-center"><Settings2 className="mr-2 h-4 w-4"/>Change Status (Admin Only):</Label>
              <Select
                value={ticket.status}
                onValueChange={(value: TicketStatus) => handleStatusChange(value)}
                disabled={isUpdatingStatus || userProfile?.role !== 'admin'}
              >
                <SelectTrigger id="status" className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              {isUpdatingStatus && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Updating status...</p>}
            </div>
          )}
          {userProfile?.role === 'manager' && (
             <div className="space-y-2 pt-2">
                <Label className="font-semibold flex items-center"><Settings2 className="mr-2 h-4 w-4"/>Current Status:</Label>
                <p className={cn("px-3 py-1.5 text-sm rounded-md border font-semibold inline-block", getStatusClass(ticket.status))}>
                    {ticket.status}
                </p>
             </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl flex items-center"><MessageSquare className="mr-2 h-6 w-6 text-primary"/>Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.comments && ticket.comments.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {ticket.comments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-md border bg-card/50 shadow-sm">
                  <p className="whitespace-pre-wrap text-sm">{comment.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    By: {comment.userDisplayName} on {format(new Date(comment.createdAt), 'MMM d, yyyy, HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No comments yet.</p>
          )}
          
          <Separator className="my-4"/>

          <div className="space-y-2">
            <Label htmlFor="newComment" className="font-semibold">Add a Comment:</Label>
            <Textarea
              id="newComment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your comment here..."
              rows={3}
              disabled={isSubmittingComment}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddComment} disabled={isSubmittingComment || !newComment.trim()} className="w-full sm:w-auto">
            {isSubmittingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
            Submit Comment
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
