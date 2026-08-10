// netlify/functions/subscribe.js

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function reply(statusCode, body) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  // Production endpoint should only accept POST.
  if (event.httpMethod !== "POST") {
    return reply(405, { error: "Method Not Allowed" });
  }

  // Reject abnormally large payloads.
  if (!event.body || event.body.length > 10000) {
    return reply(413, { error: "Invalid request" });
  }

  let payload;

  try {
    payload = JSON.parse(event.body);
  } catch {
    return reply(400, { error: "Invalid request" });
  }

  // ---------------------------
  // 1. HONEYPOT
  // ---------------------------

  const honeypot =
    typeof payload.website === "string"
      ? payload.website.trim()
      : "";

  if (honeypot) {
    // Pretend it worked so simple bots don't learn
    // that they triggered the honeypot.
    return reply(200, {
      message: "Check your inbox to confirm.",
    });
  }

  // ---------------------------
  // 2. VALIDATE EMAIL
  // ---------------------------

  const email =
    typeof payload.email === "string"
      ? payload.email.trim().toLowerCase()
      : "";

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !email ||
    email.length > 254 ||
    !EMAIL_REGEX.test(email)
  ) {
    return reply(400, {
      error: "Enter a valid email address.",
    });
  }

  // ---------------------------
  // 3. VERIFY TURNSTILE
  // ---------------------------

  const turnstileToken =
    typeof payload["cf-turnstile-response"] === "string"
      ? payload["cf-turnstile-response"]
      : "";

  const TURNSTILE_SECRET =
    process.env.TURNSTILE_SECRET_KEY;

  if (!TURNSTILE_SECRET) {
    console.error("TURNSTILE_SECRET_KEY is not configured");
    return reply(500, {
      error: "Server configuration error.",
    });
  }

  if (!turnstileToken) {
    return reply(403, {
      error: "Human verification required.",
    });
  }

  let verification;

  try {
    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: TURNSTILE_SECRET,
          response: turnstileToken,
        }),
      }
    );

    if (!verifyResponse.ok) {
      throw new Error(
        `Turnstile returned ${verifyResponse.status}`
      );
    }

    verification = await verifyResponse.json();
  } catch (error) {
    console.error(
      "Turnstile verification error:",
      error.message
    );

    return reply(403, {
      error: "Verification failed.",
    });
  }

  const allowedHostnames = new Set([
    "marcuslefton.com",
    "www.marcuslefton.com",
  ]);

  if (
    !verification.success ||
    verification.action !== "newsletter_signup" ||
    !allowedHostnames.has(verification.hostname)
  ) {
    console.warn("Rejected signup", {
      success: verification.success,
      hostname: verification.hostname,
      action: verification.action,
      errors: verification["error-codes"],
    });

    return reply(403, {
      error: "Verification failed.",
    });
  }

  // ---------------------------
  // 4. KIT
  // ---------------------------

  const KIT_API_KEY = process.env.KIT_API_KEY;
  const KIT_FORM_ID = process.env.KIT_FORM_ID;

  if (!KIT_API_KEY || !KIT_FORM_ID) {
    console.error("Kit environment variables missing");

    return reply(500, {
      error: "Server configuration error.",
    });
  }

  const kitUrl =
    `https://api.convertkit.com/v3/forms/${KIT_FORM_ID}/subscribe`;

  try {
    const kitResponse = await fetch(kitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: KIT_API_KEY,
        email,
      }),
    });

    const kitResponseText =
      await kitResponse.text();

    if (!kitResponse.ok) {
      // Keep Kit's response in SERVER logs,
      // not in the user's browser.
      console.error(
        "Kit subscription failed:",
        kitResponse.status,
        kitResponseText
      );

      return reply(502, {
        error: "Unable to subscribe right now.",
      });
    }

    return reply(200, {
      message: "Check your inbox to confirm.",
    });
  } catch (error) {
    console.error(
      "Kit request error:",
      error.message
    );

    return reply(502, {
      error: "Unable to subscribe right now.",
    });
  }
};
