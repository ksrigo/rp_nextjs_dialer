import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handler = NextAuth(authOptions);

export async function GET(request) {
  return handler(request, { params: { nextauth: ["csrf"] } });
}

export async function POST(request) {
  return handler(request, { params: { nextauth: ["csrf"] } });
}


