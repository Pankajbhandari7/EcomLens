import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Otp } from '@/models/Otp';

export async function POST(req: Request) {
  try {
    const { name, email, password, mobileNumber, otp } = await req.json();

    if (!name || !email || !password || !mobileNumber || !otp) {
      return NextResponse.json(
        { message: 'Please fill all fields, including OTP' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify OTP first
    const otpRecord = await Otp.findOne({ identifier: mobileNumber, otp });
    
    if (!otpRecord) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }
    
    // Check if OTP is expired (MongoDB TTL index handles deletion, but we can double check)
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ message: 'OTP has expired' }, { status: 400 });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { mobileNumber }] 
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email or mobile number already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      availableCredits: 10, // 10 Free credits provided on signup
    });

    // Clean up OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    return NextResponse.json(
      { message: 'User created successfully', userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error during signup:', error);
    return NextResponse.json(
      { message: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
