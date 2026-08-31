import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (!session.user.email && !(session.user as any).mobileNumber)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const query = session.user.email ? { email: session.user.email } : { mobileNumber: (session.user as any).mobileNumber };
    const adminUser = await User.findOne(query);

    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { targetUserId, credits } = await req.json();

    if (!targetUserId || typeof credits !== 'number' || credits <= 0) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
    }

    targetUser.availableCredits += credits;
    await targetUser.save();

    // Log the manual grant as a transaction (with zero amount)
    await Transaction.create({
      userId: targetUser._id,
      amount: 0,
      creditsAdded: credits,
      currency: 'N/A',
      razorpay_order_id: 'manual_grant',
      razorpay_payment_id: 'manual_grant',
      status: 'success'
    });

    return NextResponse.json({ message: 'Credits granted successfully', user: { _id: targetUser._id, availableCredits: targetUser.availableCredits } }, { status: 200 });

  } catch (error) {
    console.error('Error granting credits:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
