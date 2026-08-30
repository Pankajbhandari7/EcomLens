import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { User } from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (!session.user.email && !(session.user as any).mobileNumber)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // session user has email or mobile
    const query = session.user.email ? { email: session.user.email } : { mobileNumber: (session.user as any).mobileNumber };
    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ credits: user.availableCredits }, { status: 200 });
  } catch (error) {
    console.error('Error getting credits:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (!session.user.email && !(session.user as any).mobileNumber)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const query = session.user.email ? { email: session.user.email } : { mobileNumber: (session.user as any).mobileNumber };
    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.availableCredits <= 0) {
      return NextResponse.json({ message: 'Insufficient credits', credits: 0 }, { status: 403 });
    }

    user.availableCredits -= 1;
    await user.save();

    return NextResponse.json({ credits: user.availableCredits, success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deducting credits:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
