import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-this")

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Token não encontrado" }, { status: 401 })
    }

    // Verificar token
    const { payload } = await jwtVerify(token, JWT_SECRET)

    return NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
      },
    })
  } catch (error) {
    console.error("Erro na verificação do token:", error)
    return NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 })
  }
}
