import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Otp } from '@/models/Otp';
import { User } from '@/models/User';
import nodemailer from 'nodemailer';

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
}

export async function POST(req: Request) {
  try {
    const { email, mobileNumber, purpose } = await req.json();

    await dbConnect();

    let targetMobileNumber = mobileNumber;
    let targetEmail = email;

    if (purpose === 'login') {
      if (!email && !mobileNumber) {
        return NextResponse.json({ message: 'Email or Mobile Number is required for login OTP' }, { status: 400 });
      }
      const query = email ? { email } : { mobileNumber };
      const user = await User.findOne(query);
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      targetMobileNumber = user.mobileNumber;
      targetEmail = user.email;
    } else if (purpose === 'signup') {
      if (!mobileNumber || !email) {
        return NextResponse.json({ message: 'Mobile number and email are required for signup OTP' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ message: 'Invalid purpose' }, { status: 400 });
    }

    const otpCode = generateOtp();
    
    // Set expiry to 5 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Save or update OTP in DB
    const identifier = purpose === 'login' ? (email || targetMobileNumber) : targetMobileNumber;
    
    await Otp.findOneAndUpdate(
      { identifier },
      { identifier, otp: otpCode, expiresAt },
      { upsert: true, returnDocument: 'after' }
    );

    // Send OTP via Nodemailer
    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: targetEmail,
        subject: 'Your EcomLens Verification Code',
        text: `Your OTP for EcomLens is: ${otpCode}\n\nIt is valid for 5 minutes.`,
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${targetEmail} via Email`);
    } else {
      console.log(`MOCK OTP for ${targetEmail}: ${otpCode}`);
      // Fallback for development if Gmail isn't configured
      if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ message: 'Email service is not configured correctly' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'OTP sent successfully to your email' }, { status: 200 });

  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ message: error.message || 'An error occurred while sending OTP' }, { status: 500 });
  }
}
