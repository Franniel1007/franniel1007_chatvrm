// src/pages/index.tsx
import { useCallback, useContext, useEffect, useState } from "react";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { Message, textsToScreenplay, Screenplay } from "@/features/messages/messages";
import { speakCharacter } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import { KoeiroParam, DEFAULT_KOEIRO_PARAM } from "@/features/constants/koeiroParam";
import { getChatResponseStream } from "@/features/chat/openAiChat";
import { M_PLUS_2, Montserrat } from "next/font/google";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";
import { ElevenLabsParam, DEFAULT_ELEVEN_LABS_PARAM } from "@/features/constants/elevenLabsParam";
import { buildUrl } from "@/utils/buildUrl";
import { websocketService } from "@/services/websocketService";
import { MessageMiddleOut } from "@/features/messages/messageMiddleOut";
import VrmViewer from "@/components/vrmViewer"; // ✅ default export

const m_plus_2 = M_PLUS_2({ variable: "--font-m-plus-2", display: "swap", preload: false });
const montserrat = Montserrat({ variable: "--font-montserrat", display: "swap", subsets: ["latin"] });

type LLMCallbackResult = { processed: boolean; error?: string };

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [openAiKey, setOpenAiKey] = useState("");
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [elevenLabsParam, setElevenLabsParam] = useState<ElevenLabsParam>(DEFAULT_ELEVEN_LABS_PARAM);
  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_KOEIRO_PARAM);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [restreamTokens, setRestreamTokens] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('openRouterKey') || '';
    return '';
  });

  const customDownMessage = "Necesitas la API de OpenRouter, ve a las Opciones y vaya a la pestaña Personalidad";

  useEffect(() => {
    const params = localStorage.getItem("chatVRMParams");
    if (params) {
      const parsed = JSON.parse(params);
      setSystemPrompt(parsed.systemPrompt);
      setElevenLabsParam(parsed.elevenLabsParam);
      setChatLog(parsed.chatLog);
    }
    const savedKey = localStorage.getItem("elevenLabsKey");
    if (savedKey) setElevenLabsKey(savedKey);
    const savedBackground = localStorage.getItem('backgroundImage');
    if (savedBackground) setBackgroundImage(savedBackground);
    const savedOpenRouter = localStorage.getItem('openRouterKey');
    if (savedOpenRouter) setOpenRouterKey(savedOpenRouter);
  }, []);

  useEffect(() => {
    process.nextTick(() => {
      localStorage.setItem("chatVRMParams", JSON.stringify({ systemPrompt, elevenLabsParam, chatLog }));
      localStorage.setItem("elevenLabsKey", elevenLabsKey);
    });
  }, [systemPrompt, elevenLabsParam, chatLog]);

  useEffect(() => {
    document.body.style.backgroundImage = backgroundImage ? `url(${backgroundImage})` : `url(${buildUrl("/bg-c.png")})`;
  }, [backgroundImage]);

  const handleChangeChatLog = useCallback((targetIndex: number, text: string) => {
    const newLog = chatLog.map((v, i) => i === targetIndex ? { role: v.role, content: text } : v);
    setChatLog(newLog);
  }, [chatLog]);

  const handleSpeakAi = useCallback(
    async (screenplay: Screenplay, elevenLabsKey: string, elevenLabsParam: ElevenLabsParam, onStart?: () => void, onEnd?: () => void) => {
      setIsAISpeaking(true);
      try {
        await speakCharacter(screenplay, elevenLabsKey, elevenLabsParam, viewer,
          () => { setIsPlayingAudio(true); onStart?.(); },
          () => { setIsPlayingAudio(false); onEnd?.(); }
        );
      } catch (error) { console.error(error); } finally { setIsAISpeaking(false); }
    }, [viewer]
  );

  const handleSendChat = useCallback(async (text: string) => {
    if (!text) return;
    setChatProcessing(true);
    const messageLog = [...chatLog, { role: "user", content: text }];
    setChatLog(messageLog);

    const processedMessages = new MessageMiddleOut().process([{ role: "system", content: systemPrompt }, ...messageLog]);
    const key = openRouterKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";

    const stream = await getChatResponseStream(processedMessages, openAiKey, key, customDownMessage).catch(console.error);
    if (!stream) { setChatProcessing(false); setAssistantMessage(customDownMessage); return; }

    const reader = stream.getReader();
    let receivedMessage = "", aiTextLog = "", tag = "", sentences: string[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedMessage += value;
        const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
        if (tagMatch && tagMatch[0]) { tag = tagMatch[0]; receivedMessage = receivedMessage.slice(tag.length); }
        const sentenceMatch = receivedMessage.match(/^(.+[。．！？\n.!?]|.{10,}[、,])/);
        if (sentenceMatch && sentenceMatch[0]) {
          const sentence = sentenceMatch[0];
          sentences.push(sentence);
          receivedMessage = receivedMessage.slice(sentence.length).trimStart();
          const aiText = `${tag} ${sentence}`;
          aiTextLog += aiText;
          handleSpeakAi(textsToScreenplay([aiText], koeiroParam)[0], elevenLabsKey, elevenLabsParam, () => { setAssistantMessage(sentences.join(" ")); });
        }
      }
    } catch (e) { console.error(e); } finally { reader.releaseLock(); }

    setChatLog([...messageLog, { role: "assistant", content: aiTextLog }]);
    setChatProcessing(false);
  }, [systemPrompt, chatLog, handleSpeakAi, openAiKey, elevenLabsKey, elevenLabsParam, openRouterKey, koeiroParam]);

  useEffect(() => {
    websocketService.setLLMCallback(async (message: string): Promise<LLMCallbackResult> => {
      if (isAISpeaking || isPlayingAudio || chatProcessing) return { processed: false, error: 'System busy' };
      try { await handleSendChat(message); return { processed: true }; } catch (error) { return { processed: false, error: error instanceof Error ? error.message : 'Unknown error' }; }
    });
  }, [handleSendChat, chatProcessing, isPlayingAudio, isAISpeaking]);

  const handleOpenRouterKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => { setOpenRouterKey(event.target.value); localStorage.setItem('openRouterKey', event.target.value); };

  return (
    <div className={`${m_plus_2.variable} ${montserrat.variable}`}>
      <Meta />
      <Introduction openAiKey={openAiKey} onChangeAiKey={setOpenAiKey} elevenLabsKey={elevenLabsKey} onChangeElevenLabsKey={setElevenLabsKey} />
      <VrmViewer />
      <MessageInputContainer isChatProcessing={chatProcessing} onChatProcessStart={handleSendChat} />
      <Menu
        openAiKey={openAiKey}
        elevenLabsKey={elevenLabsKey}
        openRouterKey={openRouterKey}
        systemPrompt={systemPrompt}
        chatLog={chatLog}
        elevenLabsParam={elevenLabsParam}
        koeiroParam={koeiroParam}
        assistantMessage={assistantMessage}
        onChangeAiKey={setOpenAiKey}
        onChangeElevenLabsKey={setElevenLabsKey}
        onChangeSystemPrompt={setSystemPrompt}
        onChangeChatLog={handleChangeChatLog}
        onChangeElevenLabsParam={setElevenLabsParam}
        onChangeKoeiromapParam={setKoeiroParam}
        handleClickResetChatLog={() => setChatLog([])}
        handleClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
        backgroundImage={backgroundImage}
        onChangeBackgroundImage={setBackgroundImage}
        onTokensUpdate={setRestreamTokens}
        onChatMessage={handleSendChat}
        onChangeOpenRouterKey={handleOpenRouterKeyChange}
        customDownMessage={customDownMessage}
        onChangeCustomDownMessage={(msg: string) => console.log('Mensaje OpenRouter actualizado:', msg)}
      />
      <GitHubLink />
    </div>
  );
}
