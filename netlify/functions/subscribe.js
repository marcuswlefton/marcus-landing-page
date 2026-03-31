// netlify/functions/subscribe.js

exports.handler = async (event) => {
  // ══════════════════════════════════════════════════════════════
  // TEST MODE: Visit this URL in your browser to check everything
  // https://YOUR-SITE.netlify.app/.netlify/functions/subscribe
  // It will tell you if your env vars are set correctly.
  // ══════════════════════════════════════════════════════════════
  if (event.httpMethod === "GET") {
    const hasKey = !!process.env.KIT_API_KEY;
    const hasForm = !!process.env.KIT_FORM_ID;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "Function is live",
        KIT_API_KEY_set: hasKey,
        KIT_FORM_ID_set: hasForm,
        KIT_FORM_ID_value: hasForm ? process.env.KIT_FORM_ID : "NOT SET",
      }),
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Email is required" }),
      };
    }

    const KIT_API_KEY = process.env.KIT_API_KEY;
    const KIT_FORM_ID = process.env.KIT_FORM_ID;

    if (!KIT_API_KEY || !KIT_FORM_ID) {
      console.error("MISSING ENV VARS:", { hasKey: !!KIT_API_KEY, hasForm: !!KIT_FORM_ID });
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Server misconfigured",
          detail: "Missing KIT_API_KEY or KIT_FORM_ID in Netlify env vars",
        }),
      };
    }

    const kitUrl = `https://api.convertkit.com/v3/forms/${KIT_FORM_ID}/subscribe`;

    const response = await fetch(kitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: KIT_API_KEY,
        email: email,
      }),
    });

    const responseText = await response.text();

    if (response.ok) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Subscribed", kit_response: responseText }),
      };
    } else {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Kit rejected the request",
          status: response.status,
          kit_response: responseText,
        }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error", detail: error.message }),
    };
  }
};
