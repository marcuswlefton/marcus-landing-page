
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { email, first_name } = JSON.parse(event.body || "{}");

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email is required" }),
      };
    }

    const apiKey = process.env.KIT_API_KEY;
    const tagId = process.env.KIT_TAG_ID;

    const subscriberRes = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey,
      },
      body: JSON.stringify({
        email_address: email,
        first_name: first_name || "",
      }),
    });

    const subscriberData = await subscriberRes.json();

    if (!subscriberRes.ok) {
      return {
        statusCode: subscriberRes.status,
        body: JSON.stringify({
          error: "Failed to create subscriber",
          details: subscriberData,
        }),
      };
    }

    const subscriberId = subscriberData?.subscriber?.id || subscriberData?.id;

    if (tagId && subscriberId) {
      await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers/${subscriberId}`, {
        method: "POST",
        headers: {
          "X-Kit-Api-Key": apiKey,
        },
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        details: error.message,
      }),
    };
  }
};
