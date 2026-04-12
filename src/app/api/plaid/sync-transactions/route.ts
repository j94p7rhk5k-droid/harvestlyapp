import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, itemId, startDate, endDate } = body;

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'userId and itemId are required' },
        { status: 400 },
      );
    }

    // Look up the Plaid item from Firestore to get the accessToken
    const plaidItemRef = doc(db, 'users', userId, 'plaidItems', itemId);
    const plaidItemSnap = await getDoc(plaidItemRef);

    if (!plaidItemSnap.exists()) {
      return NextResponse.json(
        { error: 'Plaid item not found' },
        { status: 404 },
      );
    }

    const { accessToken } = plaidItemSnap.data() as { accessToken: string };

    // Default date range: last 30 days
    const now = new Date();
    const defaultEnd = endDate || now.toISOString().split('T')[0];
    const defaultStart =
      startDate ||
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

    // Fetch transactions with pagination
    let allTransactions: any[] = [];
    let totalTransactions = 0;
    let accounts: any[] = [];
    let offset = 0;

    do {
      const response = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: defaultStart,
        end_date: defaultEnd,
        options: {
          count: 500,
          offset,
        },
      });

      allTransactions = allTransactions.concat(response.data.transactions);
      totalTransactions = response.data.total_transactions;
      accounts = response.data.accounts;
      offset = allTransactions.length;
    } while (allTransactions.length < totalTransactions);

    // Map Plaid transactions to our format
    const mappedTransactions = allTransactions.map((tx) => ({
      plaidTransactionId: tx.transaction_id,
      amount: Math.abs(tx.amount), // Plaid uses negative for debits
      date: tx.date,
      name: tx.name || tx.merchant_name || 'Unknown',
      merchantName: tx.merchant_name,
      category:
        tx.personal_finance_category?.primary || tx.category?.[0] || 'Other',
      detailedCategory:
        tx.personal_finance_category?.detailed || tx.category?.[1],
      pending: tx.pending,
      accountId: tx.account_id,
      isIncome: tx.amount < 0, // Plaid: negative = money coming in
    }));

    // Update lastSynced timestamp
    await updateDoc(plaidItemRef, {
      lastSynced: new Date().toISOString(),
    });

    // Map account info
    const mappedAccounts = accounts.map((acct) => ({
      id: acct.account_id,
      name: acct.name,
      officialName: acct.official_name,
      type: acct.type,
      subtype: acct.subtype,
      balanceCurrent: acct.balances.current,
      balanceAvailable: acct.balances.available,
      mask: acct.mask,
    }));

    return NextResponse.json({
      transactions: mappedTransactions,
      totalCount: totalTransactions,
      accounts: mappedAccounts,
    });
  } catch (error: any) {
    console.error(
      'Error syncing transactions:',
      error?.response?.data || error,
    );
    const statusCode = error?.response?.status || 500;
    return NextResponse.json(
      {
        error: 'Failed to sync transactions',
        details: error?.response?.data,
      },
      { status: statusCode },
    );
  }
}
