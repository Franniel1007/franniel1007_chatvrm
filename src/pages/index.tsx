// ...imports igual que antes

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [openAiKey, setOpenAiKey] = useState("");
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [elevenLabsParam, setElevenLabsParam] = useState(DEFAULT_ELEVEN_LABS_PARAM);
  const [koeiroParam, setKoeiroParam] = useState(DEFAULT_KOEIRO_PARAM);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState(localStorage.getItem('openRouterKey') || "");
  const [customDownMessage, setCustomDownMessage] = useState("Necesitas la API de OpenRouter, ve a las Opciones y vaya a la pestaña Personalidad");
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("chatVRMParams");
    if (saved) {
      const p = JSON.parse(saved);
      setSystemPrompt(p.systemPrompt);
      setElevenLabsParam(p.elevenLabsParam);
      setChatLog(p.chatLog);
    }
    const bg = localStorage.getItem("backgroundImage");
    if (bg) setBackgroundImage(bg);
    const ek = localStorage.getItem("elevenLabsKey");
    if (ek) setElevenLabsKey(ek);
  }, []);

  useEffect(() => {
    document.body.style.backgroundImage = `url(${backgroundImage || buildUrl("/bg-c.png")})`;
    localStorage.setItem("chatVRMParams", JSON.stringify({ systemPrompt, elevenLabsParam, chatLog }));
    localStorage.setItem("elevenLabsKey", elevenLabsKey);
    localStorage.setItem("openRouterKey", openRouterKey);
  }, [systemPrompt, elevenLabsParam, chatLog, elevenLabsKey, openRouterKey, backgroundImage]);

  const handleSpeakAi = useCallback(async (screenplay: Screenplay) => {
    setIsAISpeaking(true);
    try {
      await speakCharacter(screenplay, elevenLabsKey, elevenLabsParam, viewer, undefined, undefined);
    } finally { setIsAISpeaking(false); }
  }, [viewer, elevenLabsKey, elevenLabsParam]);

  const handleSendChat = useCallback(async (text: string) => {
    if (!text) return;
    setChatProcessing(true);
    const newLog = [...chatLog, { role: "user", content: text }];
    setChatLog(newLog);

    const processor = new MessageMiddleOut();
    const processedMessages = processor.process([{ role: "system", content: systemPrompt }, ...newLog]);

    const stream = await getChatResponseStream(processedMessages, openAiKey, openRouterKey, customDownMessage).catch(() => null);
    if (!stream) {
      setAssistantMessage(customDownMessage);
      setChatProcessing(false);
      return;
    }

    const reader = stream.getReader();
    let buffer = "";
    let aiLog = "";
    const sentences: string[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += value;
        const sentenceMatch = buffer.match(/^(.+[。．！？\n.!?]|.{10,}[、,])/);
        if (!sentenceMatch) continue;

        const sentence = sentenceMatch[0];
        buffer = buffer.slice(sentence.length).trimStart();
        sentences.push(sentence);
        aiLog += sentence;

        setAssistantMessage(sentences.join(" ")); // 🔥 subtítulo en tiempo real
        const screenplay = textsToScreenplay([sentence], koeiroParam);
        handleSpeakAi(screenplay[0]);
      }
    } finally { reader.releaseLock(); }

    setChatLog([...newLog, { role: "assistant", content: aiLog }]);
    setChatProcessing(false);
  }, [chatLog, systemPrompt, koeiroParam, openAiKey, openRouterKey, customDownMessage, handleSpeakAi]);

  const handleOpenRouterKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpenRouterKey(e.target.value);
    localStorage.setItem('openRouterKey', e.target.value);
  };

  return (
    <div>
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
        onChangeChatLog={(i, t) => setChatLog(chatLog.map((v,j) => j===i?{role:v.role, content:t}:v))}
        onChangeElevenLabsParam={setElevenLabsParam}
        onChangeKoeiromapParam={setKoeiroParam}
        handleClickResetChatLog={() => setChatLog([])}
        handleClickResetSystemPrompt={() => setSystemPrompt(SYSTEM_PROMPT)}
        backgroundImage={backgroundImage}
        onChangeBackgroundImage={setBackgroundImage}
        onChatMessage={handleSendChat}
        onChangeOpenRouterKey={handleOpenRouterKeyChange}
        customDownMessage={customDownMessage}
        onChangeCustomDownMessage={setCustomDownMessage}
      />
    </div>
  );
}
