import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { CountryCode } from 'plaid';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { publicToken, userId } = body;

    if (!publicToken || !userId) {
      return NextResponse.json(
        { error: 'publicToken and userId are required' },
        { status: 400 },
      );
    }

    // Exchange the public token for an access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Fetch item details to get institution_id
    let institutionId: string | null = null;
    let institutionName: string | null = null;

    try {
      const itemResponse = await plaidClient.itemGet({
        access_token: accessToken,
      });
      institutionId = itemResponse.data.item.institution_id ?? null;

      // Fetch institution name if we have an institution_id
      if (institutionId) {
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
        });
        institutionName = institutionResponse.data.institution.name;
      }
    } catch (instError) {
      // Non-critical: log but continue without institution info
      console.warn('Could not fetch institution info:', instError);
    }

    // Store the Plaid item in Firestore
    const plaidItemRef = doc(db, 'users', userId, 'plaidItems', itemId);
    await setDoc(plaidItemRef, {
      accessToken,
      itemId,
      institutionId,
      institutionName,
      createdAt: new Date().toISOString(),
      lastSynced: null,
    });

    return NextResponse.json({
      success: true,
      itemId,
      institutionName,
    });
  } catch (error: any) {
    console.error('Error exchanging token:', error?.response?.data || error);
    const statusCode = error?.response?.status || 500;
    return NextResponse.json(
      { error: 'Failed to exchange token', details: error?.response?.data },
      { status: statusCode },
    );
  }
}
