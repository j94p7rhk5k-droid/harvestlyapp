import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { CountryCode, Products } from 'plaid';

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

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Harvestly',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error('Error creating link token:', error?.response?.data || error);
    const statusCode = error?.response?.status || 500;
    return NextResponse.json(
      { error: 'Failed to create link token', details: error?.response?.data },
      { status: statusCode },
    );
  }
}
