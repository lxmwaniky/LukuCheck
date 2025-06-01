
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsersForAdmin, setUserRoleAction, adjustUserLukuPoints, type AdminUserView } from '@/actions/adminActions';
import type { UserProfile, UserRole } from '@/contexts/AuthContext'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Loader2, UserCog, AlertTriangle, Coins, RotateCcw, Search, ChevronDown, ChevronUp, Users, Edit3, ShieldQuestion } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils'; 
import { LukuBadge } from '@/components/LukuBadge';

const ITEMS_PER_PAGE = 10;

type SortableColumn = 'username' | 'email' | 'lukuPoints' | 'currentStreak' | 'referralsMadeCount' | 'role';
type SortDirection = 'asc' | 'desc';

export default function AdminUsersPage() {
  const { user, userProfile } = useAuth(); 
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedUserForPoints, setSelectedUserForPoints] = useState<AdminUserView | null>(null);
  const [pointsToAdjust, setPointsToAdjust] = useState<string>("");
  const [pointsOperation, setPointsOperation] = useState<'add' | 'set' | 'subtract'>('add');
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);

  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUserView | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [isChangingRole, setIsChangingRole] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortableColumn>('username');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');


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

  const handleSetRole = async () => {
    if (!user?.uid || !selectedUserForRole || !newRole) return;
    if (user.uid === selectedUserForRole.uid && newRole !== 'admin') {
      toast({ title: "Action Denied", description: "You cannot change your own role to a non-admin role here.", variant: "destructive" });
      return;
    }
    setIsChangingRole(true);
    const result = await setUserRoleAction(user.uid, selectedUserForRole.uid, newRole);
    if (result.success) {
      toast({ title: "Success", description: `User role updated to ${newRole}.` });
      setSelectedUserForRole(null);
      fetchUsers(); 
    } else {
      toast({ title: "Error", description: result.error || "Failed to update user role.", variant: "destructive" });
    }
    setIsChangingRole(false);
  };

  const handleAdjustPointsSubmit = async () => {
    if (!selectedUserForPoints || !user?.uid || pointsToAdjust === "") return;
    const pointsValue = parseInt(pointsToAdjust, 10);
    if (isNaN(pointsValue)) {
        toast({ title: "Invalid Input", description: "Please enter a valid number for points.", variant: "destructive" });
        return;
    }
    if ((pointsOperation === 'add' || pointsOperation === 'subtract') && pointsValue <= 0 && operation !== 'set') {
        toast({ title: "Invalid Input", description: `For '${pointsOperation}', points must be a positive number. For 'set', any integer is valid.`, variant: "destructive" });
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

  const sortedAndFilteredUsers = useMemo(() => {
    let processedUsers = [...users];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedUsers = processedUsers.filter(u => 
        u.username?.toLowerCase().includes(lowerSearchTerm) ||
        u.email?.toLowerCase().includes(lowerSearchTerm) ||
        u.uid.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (filterRole !== 'all') {
      processedUsers = processedUsers.filter(u => (u.role || 'user') === filterRole);
    }
    
    processedUsers.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (sortColumn === 'username' || sortColumn === 'email' || sortColumn === 'role') {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      } else { // numeric columns
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return processedUsers;
  }, [users, searchTerm, filterRole, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedAndFilteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = sortedAndFilteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortIndicator = ({ column }: { column: SortableColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />;
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
  
  const canManageRoles = userProfile?.role === 'admin';

  return (
    <div className="border bg-card text-card-foreground shadow-sm rounded-lg">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2"><Users className="h-6 w-6"/> User Management</h3>
        <p className="text-sm text-muted-foreground">View, manage, and moderate user accounts. Found: {sortedAndFilteredUsers.length} / {users.length}</p>
      </div>
      <div className="p-6 pt-0 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by username, email, UID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="pl-8 w-full"
            />
          </div>
          <Select value={filterRole} onValueChange={(value: UserRole | 'all') => {setFilterRole(value); setCurrentPage(1);}}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('username')} className="cursor-pointer hover:bg-muted/50">User <SortIndicator column="username" /></TableHead>
                <TableHead onClick={() => handleSort('email')} className="cursor-pointer hover:bg-muted/50 hidden md:table-cell">Email <SortIndicator column="email" /></TableHead>
                <TableHead onClick={() => handleSort('lukuPoints')} className="cursor-pointer hover:bg-muted/50 text-center">LukuPoints <SortIndicator column="lukuPoints" /></TableHead>
                <TableHead onClick={() => handleSort('currentStreak')} className="cursor-pointer hover:bg-muted/50 text-center">Streak <SortIndicator column="currentStreak" /></TableHead>
                <TableHead onClick={() => handleSort('referralsMadeCount')} className="cursor-pointer hover:bg-muted/50 text-center hidden sm:table-cell">Referrals <SortIndicator column="referralsMadeCount" /></TableHead>
                <TableHead onClick={() => handleSort('role')} className="cursor-pointer hover:bg-muted/50 text-center">Role <SortIndicator column="role" /></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((u) => (
                <TableRow key={u.uid} className={u.uid === user?.uid ? 'bg-primary/10' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.photoURL || undefined} alt={u.username || u.email || undefined} />
                        <AvatarFallback>{(u.username || u.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium truncate max-w-[120px] sm:max-w-[150px] flex items-center">
                            {u.username || u.email?.split('@')[0]} 
                            {u.lukuPoints !== undefined && <LukuBadge lukuPoints={u.lukuPoints} className="ml-1.5" size="sm"/>}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[150px] md:hidden">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="truncate max-w-[180px] hidden md:table-cell">{u.email}</TableCell>
                  <TableCell className="text-center">{u.lukuPoints ?? 0}</TableCell>
                  <TableCell className="text-center">{u.currentStreak ?? 0}</TableCell>
                  <TableCell className="text-center hidden sm:table-cell">{u.referralsMadeCount ?? 0}</TableCell>
                  <TableCell className="text-center">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full", 
                          u.role === 'admin' ? 'bg-destructive/20 text-destructive-foreground' : 
                          u.role === 'manager' ? 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-300' : 
                          'bg-secondary text-secondary-foreground'
                      )}>
                          {u.role || 'user'}
                      </span>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {canManageRoles && (
                       <Button variant="outline" size="sm" className="px-2 py-1 h-auto text-xs" onClick={() => { setSelectedUserForRole(u); setNewRole(u.role || 'user'); }}>
                        <Edit3 className="mr-1 h-3 w-3" /> Role
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="px-2 py-1 h-auto text-xs" onClick={() => setSelectedUserForPoints(u)}>
                      <Coins className="mr-1 h-3 w-3" /> Points
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {paginatedUsers.length === 0 && <p className="text-center text-muted-foreground py-6">No users match your criteria.</p>}

        {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
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

        {selectedUserForRole && canManageRoles && (
          <Dialog open={!!selectedUserForRole} onOpenChange={(open) => { if (!open) setSelectedUserForRole(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Role for {selectedUserForRole.username || selectedUserForRole.email}</DialogTitle>
                <DialogDescription>Current Role: {selectedUserForRole.role || 'user'}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newRole" className="text-right">New Role</Label>
                    <Select
                        value={newRole}
                        onValueChange={(value: UserRole) => setNewRole(value)}
                        disabled={user?.uid === selectedUserForRole.uid && (selectedUserForRole.role === 'admin' || selectedUserForRole.role === 'manager')}
                    >
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select new role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 {user?.uid === selectedUserForRole.uid && (selectedUserForRole.role === 'admin' || selectedUserForRole.role === 'manager') &&
                  <p className="col-span-4 text-xs text-destructive text-center">You cannot change your own role from Admin/Manager here.</p>
                }
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSetRole} disabled={isChangingRole || (user?.uid === selectedUserForRole.uid && (newRole !== selectedUserForRole.role))}>
                  {isChangingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Role Change
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
