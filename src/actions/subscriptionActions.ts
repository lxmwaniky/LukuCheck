
// src/actions/subscriptionActions.ts
'use server';

import { adminDb, adminInitialized } from '@/config/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

const PREMIUM_STYLIST_BADGE = "PREMIUM_STYLIST";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("CRITICAL: STRIPE_SECRET_KEY environment variable is not set in subscriptionActions.");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20', // Use the API version you are developing against
  typescript: true,
});


export async function createStripeCheckoutSession(
  userId: string,
  userEmail: string,
  priceId: string
): Promise<{ sessionId?: string; error?: string; url?: string }> {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_APP_BASE_URL) {
    console.error("Stripe secret key or App Base URL not set for creating checkout session.");
    return { error: "Server configuration error for payments." };
  }
  if (!userId || !userEmail || !priceId) {
    return { error: "User details or price ID are missing." };
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;
  const successUrl = `${appBaseUrl}/profile?status=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${appBaseUrl}/profile?status=cancelled`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // mpesa not supported by Stripe
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId, // Firebase UID
      customer_email: userEmail, // Optional: prefill email
      success_url: successUrl,
      cancel_url: cancelUrl,
      // To associate the Checkout Session with an existing Stripe Customer object,
      // if you create/manage them separately:
      // customer: existingStripeCustomerId, 
    });

    if (!session.url) {
        return { error: 'Could not create Stripe session URL.'}
    }
    return { sessionId: session.id, url: session.url };
  } catch (error: any) {
    console.error("Error creating Stripe Checkout session:", error);
    return { error: `Failed to create checkout session: ${error.message}` };
  }
}


export async function grantPremiumAccess(
  userId: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
  stripeSubscriptionStatus?: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Server error: Admin SDK not configured." };
  }
  if (!userId) {
    return { success: false, error: "User ID is required to grant premium access." };
  }

  const userRef = adminDb.collection('users').doc(userId);

  try {
    const updateData: { [key: string]: any } = {
      isPremium: true,
      badges: FieldValue.arrayUnion(PREMIUM_STYLIST_BADGE),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (stripeCustomerId) updateData.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) updateData.stripeSubscriptionId = stripeSubscriptionId;
    if (stripeSubscriptionStatus) updateData.stripeSubscriptionStatus = stripeSubscriptionStatus;
    
    await userRef.set(updateData, { merge: true }); // Use set with merge:true to create or update
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Failed to grant premium access: ${error.message || "Unknown error"}` };
  }
}


export async function revokePremiumAccess(userId: string, stripeSubscriptionStatus?: string): Promise<{ success: boolean; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Server error: Admin SDK not configured." };
  }
  if (!userId) {
    return { success: false, error: "User ID is required to revoke premium access." };
  }

  const userRef = adminDb.collection('users').doc(userId);

  try {
    const updateData: { [key: string]: any } = {
      isPremium: false,
      badges: FieldValue.arrayRemove(PREMIUM_STYLIST_BADGE),
      updatedAt: FieldValue.serverTimestamp(),
    };
     if (stripeSubscriptionStatus) updateData.stripeSubscriptionStatus = stripeSubscriptionStatus;
    
    await userRef.update(updateData);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Failed to revoke premium access: ${error.message || "Unknown error"}` };
  }
}

export async function updateStripeSubscriptionDetails(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  stripeSubscriptionStatus: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminInitialized || !adminDb) {
    return { success: false, error: "Server error: Admin SDK not configured." };
  }
  if (!userId || !stripeCustomerId || !stripeSubscriptionId || !stripeSubscriptionStatus) {
    return { success: false, error: "All Stripe subscription details are required." };
  }

  const userRef = adminDb.collection('users').doc(userId);
  try {
    await userRef.update({
      stripeCustomerId,
      stripeSubscriptionId,
      stripeSubscriptionStatus,
      updatedAt: FieldValue.serverTimestamp(), 
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Failed to update Stripe details: ${error.message || "Unknown error"}` };
  }
}
