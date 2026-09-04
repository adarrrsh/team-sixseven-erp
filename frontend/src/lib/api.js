const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

/**
 * Dummy payment gateway. Talks to the Express backend when it is running and
 * falls back to a locally-generated receipt so the flow is always demoable.
 */
export async function payApplicationFee(payload) {
  return pay("/api/payments/admission", payload)
}

/** Semester fees and fines from the student portal. */
export async function payStudentDue(payload) {
  return pay("/api/payments/student", payload)
}

async function pay(path, payload) {
  try {
    const data = await post(path, payload)
    return { ...data, offline: false }
  } catch {
    await new Promise((r) => setTimeout(r, 900))
    return {
      ok: true,
      offline: true,
      reference: "PAY-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      applicationId: "AD-" + (2050 + Math.floor(Math.random() * 49)),
      paidAt: new Date().toISOString(),
      amount: payload.amount,
    }
  }
}
