
'use server';

import { adminDb, adminInitialized } from '@/config/firebaseAdmin';
import { FieldValue, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { verifyUserRole } from '@/actions/adminActions';
import type { UserRole } from '@/contexts/AuthContext';
import { randomUUID } from 'crypto';


export type TicketCategory = 'bug' | 'feedback' | 'other';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

// Interface representing data sent to the client (dates as strings)
export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: string; // Dates are ISO strings for client
  updatedAt: string; // Dates are ISO strings for client
  userId?: string | null;
  userDisplayName?: string | null;
  userEmail?: string | null;
  isAnonymous: boolean;
  assignedTo?: string | null;
  resolution?: string | null;
  closedAt?: string | null; // Dates are ISO strings for client
  comments?: TicketComment[];
}

export interface TicketComment {
  id: string;
  userId: string; // UID of the admin/manager who commented
  userDisplayName: string; // Display name of the admin/manager
  comment: string;
  createdAt: string; // Dates are ISO strings for client
}

// Interface for Firestore data structure (dates as Timestamps)
interface FirestoreTicketData {
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: AdminTimestamp;
  updatedAt: AdminTimestamp;
  userId?: string | null;
  userDisplayName?: string | null;
  userEmail?: string | null;
  isAnonymous: boolean;
  assignedTo?: string | null;
  resolution?: string | null;
  closedAt?: AdminTimestamp | null;
  comments?: FirestoreTicketComment[];
}

interface FirestoreTicketComment {
  id: string;
  userId: string;
  userDisplayName: string;
  comment: string;
  createdAt: AdminTimestamp;
}


export interface CreateTicketInput {
  title: string;
  description: string;
  category: TicketCategory;
  isAnonymous: boolean;
  userId?: string | null;
  userDisplayName?: string | null;
  userEmail?: string | null;
}

export async function createTicket(input: CreateTicketInput): Promise<{ success: boolean; ticketId?: string; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Ticketing system not available. Admin SDK not configured." };
  }

  const { title, description, category, isAnonymous, userId, userDisplayName, userEmail } = input;

  if (!title || !description || !category) {
    return { success: false, error: "Title, description, and category are required." };
  }

  try {
    const ticketsCollectionRef = adminDb.collection('tickets');
    const newTicketRef = ticketsCollectionRef.doc();
    const now = FieldValue.serverTimestamp();

    const ticketDataForFirestore: Omit<FirestoreTicketData, 'createdAt' | 'updatedAt' | 'comments' | 'closedAt' | 'assignedTo' | 'resolution'> & { createdAt: FirebaseFirestore.FieldValue, updatedAt: FirebaseFirestore.FieldValue } = {
      title,
      description,
      category,
      status: 'Open' as TicketStatus,
      createdAt: now,
      updatedAt: now,
      isAnonymous,
      userId: !isAnonymous && userId ? userId : null,
      userDisplayName: !isAnonymous && userDisplayName ? userDisplayName : null,
      userEmail: !isAnonymous && userEmail ? userEmail : null,
    };

    await newTicketRef.set(ticketDataForFirestore);

    return { success: true, ticketId: newTicketRef.id };
  } catch (error: any) {
    return { success: false, error: `Failed to submit ticket: ${error.message || "Unknown error"}` };
  }
}

export async function getTicketsForAdmin(callerUid: string): Promise<{ success: boolean; tickets?: Ticket[]; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Admin SDK not configured." };
  }

  const canAccess = await verifyUserRole(callerUid, ['admin', 'manager']);
  if (!canAccess) {
    return { success: false, error: "Unauthorized: Caller does not have sufficient privileges." };
  }

  try {
    const ticketsSnapshot = await adminDb.collection('tickets').orderBy('updatedAt', 'desc').get();
    const tickets = ticketsSnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreTicketData; 
      
      const comments = (data.comments || []).map((comment: FirestoreTicketComment) => ({
        ...comment,
        createdAt: comment.createdAt.toDate().toISOString(),
      })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort comments descending for list view preview
      
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        status: data.status,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
        userId: data.userId || null,
        userDisplayName: data.userDisplayName || null,
        userEmail: data.userEmail || null,
        isAnonymous: data.isAnonymous,
        assignedTo: data.assignedTo || null,
        resolution: data.resolution || null,
        closedAt: data.closedAt ? data.closedAt.toDate().toISOString() : null,
        comments: comments, // Include comments, even if empty
      };
    });
    return { success: true, tickets };
  } catch (error: any) {
    return { success: false, error: `Failed to fetch tickets: ${error.message || "Unknown error"}` };
  }
}

export async function getTicketByIdForAdmin(callerUid: string, ticketId: string): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Admin SDK not configured." };
  }
  if (!ticketId) {
    return { success: false, error: "Ticket ID is required." };
  }

  const canAccess = await verifyUserRole(callerUid, ['admin', 'manager']);
  if (!canAccess) {
    return { success: false, error: "Unauthorized: Caller does not have sufficient privileges." };
  }

  try {
    const ticketDocRef = adminDb.collection('tickets').doc(ticketId);
    const ticketDocSnap = await ticketDocRef.get();

    if (!ticketDocSnap.exists) {
      return { success: false, error: "Ticket not found." };
    }

    const data = ticketDocSnap.data() as FirestoreTicketData;
    const comments = (data.comments || []).map((comment: FirestoreTicketComment) => ({
      ...comment,
      createdAt: comment.createdAt.toDate().toISOString(),
    })).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Sort comments ascending for display in detail

    const ticket: Ticket = {
      id: ticketDocSnap.id,
      title: data.title,
      description: data.description,
      category: data.category,
      status: data.status,
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
      userId: data.userId || null,
      userDisplayName: data.userDisplayName || null,
      userEmail: data.userEmail || null,
      isAnonymous: data.isAnonymous,
      assignedTo: data.assignedTo || null,
      resolution: data.resolution || null,
      closedAt: data.closedAt ? data.closedAt.toDate().toISOString() : null,
      comments: comments,
    };
    return { success: true, ticket };
  } catch (error: any) {
    return { success: false, error: `Failed to fetch ticket: ${error.message || "Unknown error"}` };
  }
}

export async function addCommentToTicketAdmin(
  callerUid: string,
  ticketId: string,
  commentText: string,
  callerDisplayName: string 
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Admin SDK not configured." };
  }
  if (!ticketId || !commentText || !callerDisplayName) {
    return { success: false, error: "Ticket ID, comment text, and caller display name are required." };
  }

  const canComment = await verifyUserRole(callerUid, ['admin', 'manager']);
  if (!canComment) {
    return { success: false, error: "Unauthorized: Caller cannot add comments." };
  }

  try {
    const ticketDocRef = adminDb.collection('tickets').doc(ticketId);
    const newCommentId = randomUUID();
    const newComment: FirestoreTicketComment = {
      id: newCommentId,
      userId: callerUid,
      userDisplayName: callerDisplayName,
      comment: commentText,
      createdAt: AdminTimestamp.now(),
    };

    await ticketDocRef.update({
      comments: FieldValue.arrayUnion(newComment),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true, commentId: newCommentId };
  } catch (error: any) {
    return { success: false, error: `Failed to add comment: ${error.message || "Unknown error"}` };
  }
}

export async function updateTicketStatusAdmin( // Renamed for clarity, but logic is now for admin/manager
  callerUid: string,
  ticketId: string,
  newStatus: TicketStatus
): Promise<{ success: boolean; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Admin SDK not configured." };
  }
  if (!ticketId || !newStatus) {
    return { success: false, error: "Ticket ID and new status are required." };
  }

  // Allow both 'admin' and 'manager' to change status
  const canUpdateStatus = await verifyUserRole(callerUid, ['admin', 'manager']);
  if (!canUpdateStatus) {
    return { success: false, error: "Unauthorized: Caller cannot change ticket status." };
  }

  try {
    const ticketDocRef = adminDb.collection('tickets').doc(ticketId);
    const updatePayload: { status: TicketStatus; updatedAt: FirebaseFirestore.FieldValue; closedAt?: FirebaseFirestore.FieldValue | null } = {
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (newStatus === 'Closed' || newStatus === 'Resolved') {
      updatePayload.closedAt = FieldValue.serverTimestamp();
    } else {
      // If reopening, ensure closedAt is cleared if it was set.
      // It's important to check if the field exists before trying to set it to null,
      // or to explicitly set it to null if the status implies it should not be closed.
      const ticketSnap = await ticketDocRef.get();
      if (ticketSnap.exists && ticketSnap.data()?.closedAt) {
         updatePayload.closedAt = null;
      }
    }

    await ticketDocRef.update(updatePayload);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Failed to update ticket status: ${error.message || "Unknown error"}` };
  }
}

