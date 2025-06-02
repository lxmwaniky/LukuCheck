
'use server';

import { adminDb, adminInitialized } from '@/config/firebaseAdmin';
import { FieldValue, Timestamp as AdminTimestamp } from 'firebase-admin/firestore'; // Renamed to avoid conflict if needed, though not strictly here
import { verifyUserRole } from '@/actions/adminActions';
import type { UserRole } from '@/contexts/AuthContext';

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
  userId: string;
  userDisplayName: string;
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

    // Data written to Firestore uses AdminTimestamp where applicable implicitly or via serverTimestamp
    const ticketDataForFirestore = {
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
      // Optional fields default to undefined/null server-side if not provided
    };

    await newTicketRef.set(ticketDataForFirestore);

    return { success: true, ticketId: newTicketRef.id };
  } catch (error: any) {
    console.error("[TicketActions ERROR] Failed to create ticket:", error);
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
    const ticketsSnapshot = await adminDb.collection('tickets').orderBy('createdAt', 'desc').get();
    const tickets = ticketsSnapshot.docs.map(doc => {
      const data = doc.data() as FirestoreTicketData; // Assert as Firestore data type
      
      // Convert comments Timestamps
      const comments = (data.comments || []).map((comment: FirestoreTicketComment) => ({
        ...comment,
        createdAt: comment.createdAt.toDate().toISOString(),
      }));
      
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
        comments: comments,
      };
    });
    return { success: true, tickets };
  } catch (error: any) {
    console.error("[TicketActions ERROR] Failed to fetch tickets for admin:", error);
    return { success: false, error: `Failed to fetch tickets: ${error.message || "Unknown error"}` };
  }
}
