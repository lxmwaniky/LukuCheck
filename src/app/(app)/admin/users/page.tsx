
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsersForAdmin, toggleUserAdminStatus, adjustUserLukuPoints } from '@/actions/adminActions';
import type { UserProfile } from '@/contexts/AuthContext'; // Re-using for common fields
import { Button } from '@/components/ui/button';
// import { Switch } from '@/components/ui/switch'; // Not used for admin toggle yet
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, ShieldOff, UserCog, AlertTriangle, Coins, RotateCcw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils'; // For cn helper

interface AdminUserView extends Omit<UserProfile, 'createdAt' | 'lastLogin'> {
  createdAt?: string | null; // Timestamps converted to strings
  lastLogin?: string | null;  // Timestamps converted to strings
  firebaseAuthDisabled?: boolean;
}

export default function AdminUsersPage() {
  const { user } = useAuth(); // For passing callerUid
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedUserForPoints, setSelectedUserForPoints] = useState<AdminUserView | null>(null);
  const [pointsToAdjust, setPointsToAdjust] = useState<string>("");
  const [pointsOperation, setPointsOperation] = useState<'add' | 'set' | 'subtract'>('add');
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    setError(null);
    const result = await getAllUsersForAdmin(user.uid);
    if (result.success && result.users) {
      setUsers(result.users);
    } else {
      setError(result.error || "Failed to load users.");
      toast({ title: "Error", description: result.error || "Failed to load users.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleAdmin = async (targetUserId: string, currentIsAdmin: boolean) => {
    if (!user?.uid) return;
    const newAdminStatus = !currentIsAdmin;
    
    if (user.uid === targetUserId && !newAdminStatus) {
      toast({ title: "Action Denied", description: "You cannot revoke your own admin status here.", variant: "destructive" });
      return;
    }

    const result = await toggleUserAdminStatus(user.uid, targetUserId, newAdminStatus);
    if (result.success) {
      toast({ title: "Success", description: `User admin status updated to ${newAdminStatus}.` });
      fetchUsers(); 
    } else {
      toast({ title: "Error", description: result.error || "Failed to update admin status.", variant: "destructive" });
    }
  };

  const handleAdjustPointsSubmit = async () => {
    if (!selectedUserForPoints || !user?.uid || pointsToAdjust === "") return;
    
    const pointsValue = parseInt(pointsToAdjust, 10);
    if (isNaN(pointsValue)) {
        toast({ title: "Invalid Input", description: "Please enter a valid number for points.", variant: "destructive" });
        return;
    }
    if ((pointsOperation === 'add' || pointsOperation === 'subtract') && pointsValue <= 0) {
        toast({ title: "Invalid Input", description: "For 'add' or 'subtract', points must be a positive number.", variant: "destructive" });
        return;
    }


    setIsAdjustingPoints(true);
    const result = await adjustUserLukuPoints(user.uid, selectedUserForPoints.uid, pointsValue, pointsOperation);
    if (result.success) {
      toast({ title: "Success", description: `LukuPoints adjusted for ${selectedUserForPoints.username || selectedUserForPoints.uid}.` });
      setSelectedUserForPoints(null);
      setPointsToAdjust("");
      fetchUsers(); 
    } else {
      toast({ title: "Error", description: result.error || "Failed to adjust LukuPoints.", variant: "destructive" });
    }
    setIsAdjustingPoints(false);
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-destructive">
        <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
        <p>{error}</p>
        <Button onClick={fetchUsers} variant="outline" className="mt-4">
            <RotateCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="border bg-card text-card-foreground shadow-sm rounded-lg"> {/* Mimicking Card structure */}
      <div className="flex flex-col space-y-1.5 p-6"> {/* Mimicking CardHeader */}
        <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2"><UserCog className="h-6 w-6"/> User Management</h3>
        <p className="text-sm text-muted-foreground">View, manage, and moderate user accounts.</p>
      </div>
      <div className="p-6 pt-0"> {/* Mimicking CardContent */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">LukuPoints</TableHead>
                <TableHead className="text-center">Streak</TableHead>
                <TableHead className="text-center">Admin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.uid} className={u.uid === user?.uid ? 'bg-primary/10' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.photoURL || undefined} alt={u.username || u.email || undefined} />
                        <AvatarFallback>{(u.username || u.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium truncate max-w-[150px]">{u.username || u.email?.split('@')[0]}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{u.uid}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="truncate max-w-[200px]">{u.email}</TableCell>
                  <TableCell className="text-center">{u.lukuPoints ?? 0}</TableCell>
                  <TableCell className="text-center">{u.currentStreak ?? 0}</TableCell>
                  <TableCell className="text-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant={u.isAdmin ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "px-2 py-1 h-auto text-xs",
                            u.isAdmin ? "bg-green-500 hover:bg-green-600 text-white" : "border-gray-300",
                            u.uid === user?.uid ? "disabled:opacity-100 cursor-not-allowed" : ""
                          )}
                          disabled={u.uid === user?.uid} 
                        >
                          {u.isAdmin ? <ShieldCheck className="mr-1 h-4 w-4" /> : <ShieldOff className="mr-1 h-4 w-4" />}
                          {u.isAdmin ? 'Admin' : 'User'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Admin Status Change</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to {u.isAdmin ? 'revoke admin rights from' : 'grant admin rights to'} {u.username || u.email}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleToggleAdmin(u.uid, u.isAdmin || false)}>
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedUserForPoints(u)}>
                      <Coins className="mr-1 h-4 w-4" /> Adjust Points
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {users.length === 0 && <p className="text-center text-muted-foreground py-6">No users found.</p>}

        {selectedUserForPoints && (
          <Dialog open={!!selectedUserForPoints} onOpenChange={(open) => { if (!open) setSelectedUserForPoints(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adjust LukuPoints for {selectedUserForPoints.username || selectedUserForPoints.email}</DialogTitle>
                <DialogDescription>Current Points: {selectedUserForPoints.lukuPoints ?? 0}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pointsOperation" className="text-right">Operation</Label>
                    <Select
                        value={pointsOperation}
                        onValueChange={(value: 'add' | 'set' | 'subtract') => setPointsOperation(value)}
                    >
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select operation" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="add">Add Points</SelectItem>
                            <SelectItem value="set">Set Points To</SelectItem>
                            <SelectItem value="subtract">Subtract Points</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="points" className="text-right">
                    {pointsOperation === 'set' ? 'New Total' : 'Amount'}
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    value={pointsToAdjust}
                    onChange={(e) => setPointsToAdjust(e.target.value)}
                    className="col-span-3"
                    placeholder={pointsOperation === 'add' ? 'e.g., 10' : pointsOperation === 'subtract' ? 'e.g., 5' : 'e.g., 100'}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAdjustPointsSubmit} disabled={isAdjustingPoints}>
                  {isAdjustingPoints && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Adjustment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
