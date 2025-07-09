import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    return NextResponse.json({ 
      user: session.user,
      isAuthenticated: true 
    });
  } catch (error) {
    console.error("Error getting user session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}