import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

interface PlaidItem {
  accessToken: string;
  itemId: string;
  institutionName: string | null;
  tokenExpired?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 },
      );
    }

    // Get all Plaid items for this user
    const plaidItemsCol = collection(db, 'users', userId, 'plaidItems');
    const plaidItemsSnap = await getDocs(plaidItemsCol);

    if (plaidItemsSnap.empty) {
      return NextResponse.json({ accounts: [] });
    }

    const results: Array<{
      itemId: string;
      institutionName: string | null;
      accounts: Array<{
        id: string;
        name: string;
        type: string;
        subtype: string | null;
        balanceCurrent: number | null;
        balanceAvailable: number | null;
        mask: string | null;
      }>;
      error?: string;
    }> = [];

    for (const itemDoc of plaidItemsSnap.docs) {
      const item = itemDoc.data() as PlaidItem;

      // Skip items with expired tokens
      if (item.tokenExpired) {
        results.push({
          itemId: item.itemId,
          institutionName: item.institutionName,
          accounts: [],
          error: 'Token expired — please reconnect this institution.',
        });
        continue;
      }

      try {
        const accountsResponse = await plaidClient.accountsGet({
          access_token: item.accessToken,
        });

        const accounts = accountsResponse.data.accounts.map((acct) => ({
          id: acct.account_id,
          name: acct.name,
          type: acct.type,
          subtype: acct.subtype,
          balanceCurrent: acct.balances.current,
          balanceAvailable: acct.balances.available,
          mask: acct.mask,
        }));

        results.push({
          itemId: item.itemId,
          institutionName: item.institutionName,
          accounts,
        });
      } catch (itemError: any) {
        const errorCode = itemError?.response?.data?.error_code;

        // If the token is invalid/expired, mark it and skip
        if (
          errorCode === 'ITEM_LOGIN_REQUIRED' ||
          errorCode === 'INVALID_ACCESS_TOKEN'
        ) {
          const itemRef = doc(db, 'users', userId, 'plaidItems', item.itemId);
          await updateDoc(itemRef, { tokenExpired: true });

          results.push({
            itemId: item.itemId,
            institutionName: item.institutionName,
            accounts: [],
            error: 'Token expired — please reconnect this institution.',
          });
        } else {
          console.error(
            `Error fetching accounts for item ${item.itemId}:`,
            itemError?.response?.data || itemError,
          );
          results.push({
            itemId: item.itemId,
            institutionName: item.institutionName,
            accounts: [],
            error: 'Failed to fetch accounts for this institution.',
          });
        }
      }
    }

    return NextResponse.json({ accounts: results });
  } catch (error: any) {
    console.error('Error getting accounts:', error?.response?.data || error);
    const statusCode = error?.response?.status || 500;
    return NextResponse.json(
      { error: 'Failed to get accounts', details: error?.response?.data },
      { status: statusCode },
    );
  }
}
