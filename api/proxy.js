export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Security Validation - Check Referrer/Origin
  const referer = req.headers.referer || req.headers.referrer || "";
  const origin = req.headers.origin || "";
  const userAgent = req.headers["user-agent"] || "";

  const isDevelopment =
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview" ||
    referer.includes("localhost") ||
    origin.includes("localhost");

  // Get allowed domains from environment variable
  const envDomains = process.env.ALLOWED_DOMAINS
    ? process.env.ALLOWED_DOMAINS.split(",").map((d) => d.trim())
    : [];

  const allowedDomains = [...envDomains];

  // Add development domains
  if (isDevelopment) {
    allowedDomains.push("localhost", "127.0.0.1", "vercel.app");
  }

  const isAuthorizedReferrer = allowedDomains.some(
    (domain) => referer.includes(domain) || origin.includes(domain)
  );

  // Allow requests during development or from authorized domains
  if (!isDevelopment && !isAuthorizedReferrer && allowedDomains.length > 0) {
    console.log("Blocked access from:", { referer, origin, userAgent });
    return res.status(403).json({
      error: "Access denied: Unauthorized domain",
    });
  }

  // Validate request body
  const { Text, UserName, SourceName, SessionId, is_draft } = req.body;

  if (!Text && Text !== "") {
    return res.status(400).json({ error: "Text is required" });
  }

  // Get environment variables
  const PERSONAL_AI_API_KEY = process.env.PERSONAL_AI_API_KEY;
  const DOMAIN_NAME = process.env.DOMAIN_NAME;
  const PERSONAL_AI_API_URL =
    "https://api-enterprise.personal.ai/v1/message/stream";

  if (!PERSONAL_AI_API_KEY) {
    console.error("Personal AI API key not configured");
    return res.status(500).json({ error: "Service configuration error" });
  }

  if (!DOMAIN_NAME) {
    console.error("Domain name not configured");
    return res.status(500).json({ error: "Service configuration error" });
  }

  try {
    // Make request to Personal AI API with hidden credentials
    const personalAiResponse = await fetch(PERSONAL_AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PERSONAL_AI_API_KEY, // Hidden from client
      },
      body: JSON.stringify({
        Text: Text,
        UserName: UserName || "anonymous@user.com",
        SourceName: SourceName || "WebChat",
        SessionId: SessionId || `session_${Date.now()}`,
        DomainName: DOMAIN_NAME, // Hidden from client
        is_draft: is_draft || false,
      }),
    });

    if (!personalAiResponse.ok) {
      console.error(
        "Personal AI API error:",
        personalAiResponse.status,
        personalAiResponse.statusText
      );
      return res.status(personalAiResponse.status).json({
        error: "Failed to get response from AI service",
      });
    }

    // Set up streaming response headers
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = personalAiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;

          try {
            // Handle Server-Sent Events format
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();

              if (data === "[DONE]" || data === "") {
                // Forward the completion signal
                res.write(
                  `data: ${JSON.stringify({
                    ai_message: "",
                    session_id: SessionId,
                  })}\n\n`
                );
                continue;
              }

              try {
                const parsedData = JSON.parse(data);

                // Forward the parsed data directly to maintain compatibility
                const responseData = {
                  ai_message: parsedData.ai_message || "",
                  session_id: SessionId,
                  has_followup: parsedData.has_followup || false,
                };

                res.write(`data: ${JSON.stringify(responseData)}\n\n`);
              } catch (parseError) {
                // If not valid JSON, treat as plain text
                const responseData = {
                  ai_message: data,
                  session_id: SessionId,
                  has_followup: false,
                };
                res.write(`data: ${JSON.stringify(responseData)}\n\n`);
              }
            } else {
              // Try parsing as direct JSON
              try {
                const parsedData = JSON.parse(line);
                const responseData = {
                  ai_message: parsedData.ai_message || parsedData.text || "",
                  session_id: SessionId,
                  has_followup: parsedData.has_followup || false,
                };
                res.write(`data: ${JSON.stringify(responseData)}\n\n`);
              } catch (parseError) {
                // If not JSON, treat as plain text
                const responseData = {
                  ai_message: line.trim(),
                  session_id: SessionId,
                  has_followup: false,
                };
                res.write(`data: ${JSON.stringify(responseData)}\n\n`);
              }
            }
          } catch (error) {
            console.error("Error processing streaming line:", error);
            // Continue processing other lines
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          if (buffer.startsWith("data: ")) {
            const data = buffer.slice(6).trim();
            try {
              const parsedData = JSON.parse(data);
              const responseData = {
                ai_message: parsedData.ai_message || "",
                session_id: SessionId,
                has_followup: parsedData.has_followup || false,
              };
              res.write(`data: ${JSON.stringify(responseData)}\n\n`);
            } catch (parseError) {
              const responseData = {
                ai_message: data,
                session_id: SessionId,
                has_followup: false,
              };
              res.write(`data: ${JSON.stringify(responseData)}\n\n`);
            }
          } else {
            try {
              const parsedData = JSON.parse(buffer);
              const responseData = {
                ai_message: parsedData.ai_message || parsedData.text || "",
                session_id: SessionId,
                has_followup: parsedData.has_followup || false,
              };
              res.write(`data: ${JSON.stringify(responseData)}\n\n`);
            } catch (parseError) {
              const responseData = {
                ai_message: buffer.trim(),
                session_id: SessionId,
                has_followup: false,
              };
              res.write(`data: ${JSON.stringify(responseData)}\n\n`);
            }
          }
        } catch (error) {
          console.error("Error processing remaining buffer:", error);
        }
      }
    } catch (streamError) {
      console.error("Streaming error:", streamError);
      // Send error message to frontend
      const errorFormat = {
        ai_message:
          "I apologize, but I encountered an error while processing your request. Please try again.",
        session_id: SessionId,
        has_followup: false,
      };
      res.write(`data: ${JSON.stringify(errorFormat)}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error("API Handler Error:", error);

    // Send error response in expected format
    res.setHeader("Content-Type", "text/plain");
    const errorResponse = {
      ai_message:
        "I apologize, but I'm having trouble responding right now. Please try again.",
      session_id: SessionId,
      has_followup: false,
    };
    res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
    res.end();
  }
}
