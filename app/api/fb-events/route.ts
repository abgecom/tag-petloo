import { type NextRequest, NextResponse } from "next/server"
import { sendServerEvent, hashData } from "@/lib/fb-capi"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventName, eventId, eventData, url, userData: clientUserData } = body

    if (!eventName || !eventId) {
      return NextResponse.json(
        { error: "Missing required fields: eventName, eventId" },
        { status: 400 }
      )
    }

    const cookies = request.cookies
    const fbp = cookies.get("_fbp")?.value
    const fbc = cookies.get("_fbc")?.value

    const forwardedFor = request.headers.get("x-forwarded-for")
    const clientIp = forwardedFor?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "127.0.0.1"
    const userAgent = request.headers.get("user-agent") || "Unknown"

    const userData: Record<string, string | undefined> = {
      fbp,
      fbc,
      client_ip_address: clientIp,
      client_user_agent: userAgent,
      country: "br",
    }

    if (clientUserData?.email) {
      userData.em = hashData(clientUserData.email)
    }
    if (clientUserData?.phone) {
      userData.ph = hashData(clientUserData.phone.replace(/\D/g, ""))
    }
    if (clientUserData?.firstName) {
      userData.fn = hashData(clientUserData.firstName)
    }
    if (clientUserData?.lastName) {
      userData.ln = hashData(clientUserData.lastName)
    }

    const result = await sendServerEvent({
      eventName,
      eventID: eventId,
      eventSourceUrl: url || request.headers.get("referer") || "",
      userData,
      customData: eventData,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[FB Events API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
