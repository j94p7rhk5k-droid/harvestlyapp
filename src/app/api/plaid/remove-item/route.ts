import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, itemId } = body;

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'userId and itemId are required' },
        { status: 400 },
      );
    }

    // Look up the access token from Firestore
    const plaidItemRef = doc(db, 'users', userId, 'plaidItems', itemId);
    const plaidItemSnap = await getDoc(plaidItemRef);

    if (!plaidItemSnap.exists()) {
      return NextResponse.json(
        { error: 'Plaid item not found' },
        { status: 404 },
      );
    }

    const { accessToken } = plaidItemSnap.data() as { accessToken: string };

    // Remove the item from Plaid
    try {
      await plaidClient.itemRemove({ access_token: accessToken });
    } catch (removeError: any) {
      // Log but continue with Firestore cleanup even if Plaid removal fails
      // (e.g., token was already invalid)
      console.warn(
        'Plaid itemRemove failed (continuing with cleanup):',
        removeError?.response?.data || removeError,
      );
    }

    // Delete the Firestore document
    await deleteDoc(plaidItemRef);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing item:', error?.response?.data || error);
    const statusCode = error?.response?.status || 500;
    return NextResponse.json(
      { error: 'Failed to remove item', details: error?.response?.data },
      { status: statusCode },
    );
  }
}
