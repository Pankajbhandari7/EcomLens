import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Otp } from '@/models/Otp';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { identifier, otp, newPassword } = await req.json();

    if (!identifier || !otp || !newPassword) {
      return NextResponse.json({ message: 'Identifier, OTP, and new password are required' }, { status: 400 });
    }

    await dbConnect();

    // Verify OTP
    const otpRecord = await Otp.findOne({ identifier, otp });
    
    if (!otpRecord) {
      return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
    }
    
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ message: 'OTP has expired' }, { status: 400 });
    }

    // Find User
    const user = await User.findOne({
      $or: [{ email: identifier }, { mobileNumber: identifier }]
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Clean up OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ message: error.message || 'An error occurred while resetting password' }, { status: 500 });
  }
}
