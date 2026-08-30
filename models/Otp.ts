import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOtp extends Document {
  identifier: string; // The email or mobile number this OTP is for
  otp: string;
  createdAt: Date;
  expiresAt: Date;
}

const OtpSchema: Schema = new Schema({
  identifier: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '5m' }, // Automatically delete after 5 minutes
  },
});

export const Otp: Model<IOtp> = mongoose.models.Otp || mongoose.model<IOtp>('Otp', OtpSchema);
