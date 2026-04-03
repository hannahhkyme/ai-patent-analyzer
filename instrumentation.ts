export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnvOrThrow } = await import("./lib/env");
    try {
      validateEnvOrThrow();
    } catch (e) {
      console.error("[env]", e);
      throw e;
    }
  }
}
