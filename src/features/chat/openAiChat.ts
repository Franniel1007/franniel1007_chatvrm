export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function getChatResponseStream(
  messages: Message[],
  apiKey: string,
  openRouterKey: string,
  customDownMessage: string
) {
  return new ReadableStream({
    async start(controller) {
      try {
        if (!openRouterKey || openRouterKey.trim() === "") {
          controller.enqueue(customDownMessage);
          return controller.close();
        }

        const generation = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.0-flash-exp:free",
              messages,
              temperature: 0.7,
              max_tokens: 200,
              stream: true,
            }),
          }
        );

        if (generation.status === 401 || generation.status === 403) {
          controller.enqueue("La API de OpenRouter no funciona o es inválida");
          return controller.close();
        }

        if (generation.status >= 500) {
          controller.enqueue(customDownMessage || "Servidor caído, intenta más tarde.");
          return controller.close();
        }

        if (generation.body) {
          const reader = generation.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (!line.startsWith("data:")) continue;
                if (line.trim() === "data: [DONE]") continue;

                try {
                  const json = JSON.parse(line.substring(5));
                  const content = json.choices[0].delta.content;
                  if (content) controller.enqueue(content);
                } catch (e) {
                  console.error("Error parsing stream line:", e);
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
      } catch (error) {
        controller.enqueue(customDownMessage || "Error de conexión con OpenRouter.");
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });
}
