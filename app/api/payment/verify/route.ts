import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (!session.user.email && !(session.user as any).mobileNumber)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ message: 'Payment gateway not configured' }, { status: 500 });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json({ message: 'Invalid payment signature' }, { status: 400 });
    }

    await dbConnect();

    const query = session.user.email ? { email: session.user.email } : { mobileNumber: (session.user as any).mobileNumber };
    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.fetch(razorpay_order_id);
    
    let creditsToAdd = 0;
    if (order.amount === 3900) {
      creditsToAdd = 20;
    } else if (order.amount === 9900) {
      creditsToAdd = 60;
    } else if (order.amount === 14900) {
      creditsToAdd = 100;
    } else {
      return NextResponse.json({ message: 'Invalid order amount' }, { status: 400 });
    }

    user.availableCredits += creditsToAdd;
    await user.save();

    return NextResponse.json({ message: 'Payment successful, credits added', credits: user.availableCredits, success: true }, { status: 200 });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
