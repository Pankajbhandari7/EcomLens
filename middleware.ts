import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    // Agar user logged in nahi hai, toh NextAuth by default is page par redirect kar dega
    signIn: "/login",
  },
});

export const config = {
  // Ye matcher decide karta hai ki kin routes ko protect karna hai
  // Humne in routes ko exclude (chhod diya) kiya hai:
  // - /api/auth/* aur /api/signup (taki background me signup/login API chal sake)
  // - /login aur /signup (taki un pages par log jaa sake)
  // - next.js ke static assets (_next/static, _next/image, favicon.ico)
  matcher: [
    "/((?!api/auth|login|signup|_next/static|_next/image|favicon.ico).*)"
  ],
};
