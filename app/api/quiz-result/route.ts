import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (body.action === "start") {
      const { error } = await supabase.from("quiz_tagloo_results").insert([{
        session_id: body.session_id,
        tutor_name: body.tutor_name,
        pet_name: body.pet_name,
        started_at: body.started_at,
        completed: false,
        utm_source: body.utm_source,
        utm_medium: body.utm_medium,
        utm_campaign: body.utm_campaign,
      }])
      if (error) {
        console.error("[Quiz API] Erro no insert:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (body.action === "progress") {
      const { error } = await supabase
        .from("quiz_tagloo_results")
        .update({
          last_step_id: body.last_step_id,
          last_step_index: body.last_step_index,
          last_step_at: body.last_step_at || new Date().toISOString(),
        })
        .eq("session_id", body.session_id)

      if (error) {
        console.error("[Quiz API] Erro no progress:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (body.action === "complete") {
      const { error } = await supabase
        .from("quiz_tagloo_results")
        .update({
          tutor_name: body.tutor_name,
          pet_name: body.pet_name,
          pet_type: body.pet_type,
          location: body.location,
          already_lost: body.already_lost,
          pet_routine: body.pet_routine,
          current_protection: body.current_protection,
          biggest_fear: body.biggest_fear,
          awareness: body.awareness,
          risk_score: body.risk_score,
          risk_level: body.risk_level,
          all_answers: body.all_answers,
          completed: true,
          completed_at: body.completed_at,
        })
        .eq("session_id", body.session_id)

      if (error) {
        console.error("[Quiz API] Erro no update:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[Quiz API] Erro:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
