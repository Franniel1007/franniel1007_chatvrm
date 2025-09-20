import { Message } from "../messages/messages";

export async function getChatResponse(messages: Message[], apiKey: string) {
  throw new Error("Not implemented");
}

export async function getChatResponseStream(
  messages: Message[],
  apiKey: string,
  openRouterKey: string,
  customDownMessage: string // <- añadido para mensaje configurable
) {
  console.log("getChatResponseStream");

  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      try {
        const OPENROUTER_API_KEY = openRouterKey;
        const YOUR_SITE_URL = "https://chat-vrm-window.vercel.app/";
        const YOUR_SITE_NAME = "ChatVRM";

        const generation = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "HTTP-Referer": `${YOUR_SITE_URL}`,
              "X-Title": `${YOUR_SITE_NAME}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.0-flash-exp:free",
              messages: messages,
              temperature: 0.7,
              max_tokens: 200,
              stream: true,
            }),
          }
        );

        // --- Si la API Key es inválida ---
        if (generation.status === 401 || generation.status === 403) {
          controller.enqueue(
            "La API de OpenRouter no funciona o es inválida"
          );
          return controller.close();
        }

        // --- Si el servidor de OpenRouter está caído ---
        if (generation.status >= 500) {
          controller.enqueue(
            customDownMessage ||
              "El servidor de OpenRouter está caído. Inténtalo más tarde."
          );
          return controller.close();
        }

        if (generation.body) {
          const reader = generation.body.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              let chunk = new TextDecoder().decode(value);
              let lines = chunk.split("\n");

              const SSE_COMMENT = ": OPENROUTER PROCESSING";
              lines = lines.filter(
                (line) => !line.trim().startsWith(SSE_COMMENT)
              );
              lines = lines.filter(
                (line) => !line.trim().endsWith("data: [DONE]")
              );

              const dataLines = lines.filter((line) =>
                line.startsWith("data:")
              );

              const parsedMessages = dataLines.map((line) => {
                const jsonStr = line.substring(5); // remove "data: "
                return JSON.parse(jsonStr);
              });

              parsedMessages.forEach((msg) => {
                const content = msg.choices[0].delta.content;
                if (content) controller.enqueue(content);
              });
            }
          } catch (error) {
            console.error("Error leyendo el stream", error);
          } finally {
            reader.releaseLock();
          }
        }
      } catch (error) {
        controller.enqueue(
          customDownMessage || "Error de conexión con OpenRouter."
        );
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}
