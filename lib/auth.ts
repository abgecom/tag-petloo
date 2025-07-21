import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

export interface AdminUser {
  id: string
  email: string
  name: string
  is_active: boolean
  created_at: string
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
  try {
    // Buscar usuário no banco
    const { data: user, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single()

    if (error || !user) {
      console.log("Usuário não encontrado ou inativo")
      return null
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      console.log("Senha inválida")
      return null
    }

    // Retornar dados do usuário (sem a senha)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      is_active: user.is_active,
      created_at: user.created_at,
    }
  } catch (error) {
    console.error("Erro na autenticação:", error)
    return null
  }
}

export async function createAdminUser(email: string, password: string, name: string): Promise<boolean> {
  try {
    const passwordHash = await bcrypt.hash(password, 10)

    const { error } = await supabaseAdmin.from("admin_users").insert({
      email,
      password_hash: passwordHash,
      name,
    })

    return !error
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return false
  }
}
