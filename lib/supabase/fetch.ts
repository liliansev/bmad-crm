// Bounded requests finish cleanly during a service/network outage.
export const authFetch: typeof fetch = async (input, init) => {
  try {
    const timeout = AbortSignal.timeout(8_000);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    return await fetch(input, { ...init, signal, cache: "no-store" });
  } catch {
    return Response.json({ message: "Authentication service unavailable", code: "service_unavailable" }, { status: 503 });
  }
};
