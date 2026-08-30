import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import Razorpay from 'razorpay';
import dbConnect from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (!session.user.email && !(session.user as any).mobileNumber)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await req.json();

    const allowedAmounts = [39, 99, 149];
    if (!amount || !allowedAmounts.includes(amount)) {
      return NextResponse.json({ message: 'Invalid package amount' }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys not found');
      return NextResponse.json({ message: 'Payment gateway not configured' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount * 100, // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json({ ...order, key_id: process.env.RAZORPAY_KEY_ID }, { status: 200 });
  } catch (error) {
    console.error('Error creating razorpay order:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
