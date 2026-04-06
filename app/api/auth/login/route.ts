import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/auth"
import { SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-this")

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Autenticar usuário
    const user = await authenticateAdmin(email, password)

    if (!user) {
      return NextResponse.json({ success: false, error: "Credenciais inválidas" }, { status: 401 })
    }

    // Criar JWT token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .setIssuedAt()
      .sign(JWT_SECRET)

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })

    // Definir cookie httpOnly
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 horas
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
