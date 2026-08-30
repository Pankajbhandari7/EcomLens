import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  password?: string;
  mobileNumber?: string;
  availableCredits: number;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
  },
  name: {
    type: String,
  },
  password: {
    type: String,
    required: false,
  },
  mobileNumber: {
    type: String,
    required: false, // Make it optional for backwards compatibility, but we will require it in our routes.
  },
  availableCredits: {
    type: Number,
    default: 10,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
