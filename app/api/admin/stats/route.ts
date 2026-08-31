import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Transaction } from '@/models/Transaction';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (!session.user.email && !(session.user as any).mobileNumber)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const query = session.user.email ? { email: session.user.email } : { mobileNumber: (session.user as any).mobileNumber };
    const user = await User.findOne(query);

    if (!user || !user.isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get stats
    const totalUsers = await User.countDocuments();
    
    const revenueResult = await Transaction.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]);
    
    // Convert from paise to rupees or just use as is (assuming it's stored exactly as received from Razorpay)
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue / 100 : 0;

    return NextResponse.json({
      totalUsers,
      totalRevenue,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
