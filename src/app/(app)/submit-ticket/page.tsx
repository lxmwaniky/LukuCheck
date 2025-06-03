
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { createTicket, type TicketCategory, type CreateTicketInput } from '@/actions/ticketActions';
import { Loader2, Send, AlertTriangle, Ticket as TicketIcon, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


// --- Service Suspension Flag ---
const IS_SERVICE_SUSPENDED = true;
// --- End Service Suspension Flag ---

export default function SubmitTicketPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('feedback');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (IS_SERVICE_SUSPENDED) {
        toast({
            title: "Service Suspended",
            description: "Ticket submissions are temporarily unavailable.",
            variant: "default",
        });
        return;
    }

    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and description for your ticket.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);

    const ticketInput: CreateTicketInput = {
      title: title.trim(),
      description: description.trim(),
      category,
      isAnonymous,
    };

    if (user && !isAnonymous) {
      ticketInput.userId = user.uid;
      ticketInput.userDisplayName = userProfile?.username || user.displayName || 'Unknown User';
      ticketInput.userEmail = user.email || 'No email';
    }

    const result = await createTicket(ticketInput);

    if (result.success) {
      toast({
        title: "Ticket Submitted!",
        description: `Your ticket (ID: ${result.ticketId}) has been received. We'll get back to you if needed.`,
      });
      setTitle('');
      setDescription('');
      setCategory('feedback');
      setIsAnonymous(false);
    } else {
      toast({
        title: "Submission Failed",
        description: result.error || "Could not submit your ticket. Please try again.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
            <TicketIcon className="h-7 w-7 text-primary" /> Submit a Support Ticket
          </CardTitle>
          <CardDescription>
            Have a bug to report, feedback to share, or another issue? Let us know.
          </CardDescription>
        </CardHeader>
        {IS_SERVICE_SUSPENDED && (
            <CardContent>
                 <Alert variant="destructive" className="mb-6">
                    <XCircle className="h-5 w-5" />
                    <AlertTitle>Submissions Temporarily Suspended</AlertTitle>
                    <AlertDescription>
                    Ticket submissions are currently unavailable due to service suspension. We apologize for any inconvenience.
                    </AlertDescription>
                </Alert>
            </CardContent>
        )}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Leaderboard not updating"
                disabled={isSubmitting || IS_SERVICE_SUSPENDED}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide as much detail as possible..."
                rows={5}
                disabled={isSubmitting || IS_SERVICE_SUSPENDED}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(value: TicketCategory) => setCategory(value)}
                disabled={isSubmitting || IS_SERVICE_SUSPENDED}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAnonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                disabled={isSubmitting || !user || IS_SERVICE_SUSPENDED}
              />
              <Label htmlFor="isAnonymous" className="text-sm font-normal">
                Submit Anonymously { !user && "(Login to submit with your details)"}
              </Label>
            </div>
             {isAnonymous && user && !IS_SERVICE_SUSPENDED && (
                <div className="text-xs text-muted-foreground p-2 border border-dashed rounded-md">
                    Note: Submitting anonymously means your user details (email, username) will not be attached to this ticket. This may make it harder for us to follow up with you directly.
                </div>
            )}

          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting || IS_SERVICE_SUSPENDED}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit Ticket
            </Button>
            <Link href="/" passHref legacyBehavior>
                 <Button variant="link" className="text-sm text-muted-foreground">
                    Back to Home
                 </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

