import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken: string | null;
    // profileComplete: boolean | null;
    missing: string[] | null;
    email: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    appAccessToken?: string | null;
    // profileComplete?: boolean | null;
    missing?: string[] | null;
    email?: string | null;
  }
}
