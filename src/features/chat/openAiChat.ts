// openAIchat.ts

// Definición del tipo Message directamente aquí
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function getChatResponseStream(
  messages: Message[],
  apiKey: string,
  openRouterKey: string,
  customDownMessage: string // <- mensaje configurable desde settings
) {
  console.log("getChatResponseStream");

  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      try {
        // --- CASO 1: API en blanco ---
        if (!openRouterKey || openRouterKey.trim() === "") {
          controller.enqueue(
            "Necesitas la API de OpenRouter, ve a las Opciones y vaya a la pestaña Personalidad"
          );
          return controller.close();
        }

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

        // --- CASO 2: API inválida ---
        if (generation.status === 401 || generation.status === 403) {
          controller.enqueue("La API de OpenRouter no funciona o es inválida");
          return controller.close();
        }

        // --- CASO 3: Servidor caído ---
        if (generation.status >= 500) {
          controller.enqueue(
            customDownMessage ||
              "El servidor de OpenRouter está caído. Inténtalo más tarde."
          );
          return controller.close();
        }

        // --- Lógica normal de streaming ---
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

              const messages = dataLines.map((line) => {
                const jsonStr = line.substring(5);
                return JSON.parse(jsonStr);
              });

              messages.forEach((message) => {
                const content = message.choices[0].delta.content;
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
        // --- CASO 3 (error de conexión) ---
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
