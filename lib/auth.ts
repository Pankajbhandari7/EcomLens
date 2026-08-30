import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import { Otp } from "@/models/Otp";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Mobile Number", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        loginType: { label: "Login Type", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.loginType) {
          throw new Error("Identifier and login type are required");
        }

        await dbConnect();
        
        // Find user by email or mobileNumber
        const user = await User.findOne({
          $or: [{ email: credentials.identifier }, { mobileNumber: credentials.identifier }]
        });
        
        if (!user) {
          throw new Error("User not found");
        }

        if (credentials.loginType === 'password') {
          if (!credentials.password || !user.password) {
            throw new Error("Invalid credentials");
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isCorrectPassword) {
            throw new Error("Invalid credentials");
          }
        } else if (credentials.loginType === 'otp') {
          if (!credentials.otp) {
            throw new Error("OTP is required");
          }

          // Verify OTP
          const otpRecord = await Otp.findOne({ identifier: credentials.identifier, otp: credentials.otp });
          
          if (!otpRecord) {
            throw new Error("Invalid or expired OTP");
          }
          
          if (new Date() > otpRecord.expiresAt) {
            throw new Error("OTP has expired");
          }

          // Clean up OTP
          await Otp.deleteOne({ _id: otpRecord._id });
        } else {
          throw new Error("Invalid login type");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
