// netlify/functions/subscribe.js

const ALLOWED_ORIGINS = new Set([
  "https://marcuslefton.com",
  "https://www.marcuslefton.com",
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, {
      error: "Method Not Allowed",
    });
  }

  // Basic origin check
  const origin =
    event.headers?.origin ||
    event.headers?.Origin ||
    "";

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    console.warn("Blocked unexpected origin:", origin);

    return jsonResponse(403, {
      error: "Forbidden",
    });
  }

  // Reject empty or unusually large requests
  if (!event.body || event.body.length > 10000) {
    return jsonResponse(400, {
      error: "Invalid request",
    });
  }

  // Parse the incoming request
  let payload;

  try {
    payload = JSON.parse(event.body);
  } catch (error) {
    return jsonResponse(400, {
      error: "Invalid request",
    });
  }

  // Honeypot
  // Real users should never fill this field.
  const honeypot =
    typeof payload.website === "string"
      ? payload.website.trim()
      : "";

  if (honeypot) {
    console.warn("Honeypot triggered.");

    // Pretend the signup worked so bots don't learn
    // that they were blocked.
    return jsonResponse(200, {
      message: "Subscribed",
    });
  }

  // Normalize + validate email
  const email =
    typeof payload.email === "string"
      ? payload.email.trim().toLowerCase()
      : "";

  if (
    !email ||
    email.length > 254 ||
    !EMAIL_REGEX.test(email)
  ) {
    return jsonResponse(400, {
      error: "Enter a valid email address.",
    });
  }

  // Reject a few obvious malformed addresses
  if (
    email.includes("..") ||
    email.startsWith(".") ||
    email.endsWith(".")
  ) {
    return jsonResponse(400, {
      error: "Enter a valid email address.",
    });
  }

  // Check required Netlify environment variables
  const KIT_API_KEY = process.env.KIT_API_KEY;
  const KIT_FORM_ID = process.env.KIT_FORM_ID;

  if (!KIT_API_KEY || !KIT_FORM_ID) {
    console.error("Missing Kit environment variables.", {
      hasApiKey: Boolean(KIT_API_KEY),
      hasFormId: Boolean(KIT_FORM_ID),
    });

    return jsonResponse(500, {
      error: "Server configuration error.",
    });
  }

  // Subscribe through Kit
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

    const kitResponseText = await kitResponse.text();

    if (!kitResponse.ok) {
      console.error(
        "Kit rejected subscription:",
        kitResponse.status,
        kitResponseText
      );

      return jsonResponse(502, {
        error: "Unable to subscribe right now.",
      });
    }

    return jsonResponse(200, {
      message: "Almost there. Check your inbox to confirm your subscription.",
    });
  } catch (error) {
    console.error(
      "Kit subscription request failed:",
      error.message
    );

    return jsonResponse(502, {
      error: "Unable to subscribe right now.",
    });
  }
};
