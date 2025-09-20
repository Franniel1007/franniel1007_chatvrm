// src/components/menu.tsx
import { IconButton } from "./iconButton";
import { Message } from "@/features/messages/messages";
import { ElevenLabsParam } from "@/features/constants/elevenLabsParam";
import { KoeiroParam } from "@/features/constants/koeiroParam";
import { ChatLog } from "./chatLog";
import React, { useCallback, useContext, useRef, useState, useEffect } from "react";
import { Settings, MessageWithChat } from "./settings";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { AssistantText } from "./assistantText";

type Props = {
  openAiKey: string;
  elevenLabsKey: string;
  systemPrompt: string;
  chatLog: Message[];
  elevenLabsParam: ElevenLabsParam;
  koeiroParam: KoeiroParam;
  assistantMessage: string;
  onChangeSystemPrompt: (systemPrompt: string) => void;
  onChangeAiKey: (key: string) => void;
  onChangeElevenLabsKey: (key: string) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeElevenLabsParam: (param: ElevenLabsParam) => void;
  onChangeKoeiromapParam: (param: KoeiroParam) => void;
  handleClickResetChatLog: () => void;
  handleClickResetSystemPrompt: () => void;
  backgroundImage: string;
  onChangeBackgroundImage: (value: string) => void;
  onChatMessage: (message: any) => void;
  onTokensUpdate: (tokens: any) => void;
  onChangeOpenRouterKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  openRouterKey: string;
};

export const Menu = ({
  openAiKey,
  elevenLabsKey,
  openRouterKey,
  systemPrompt,
  chatLog,
  elevenLabsParam,
  koeiroParam,
  assistantMessage,
  onChangeSystemPrompt,
  onChangeAiKey,
  onChangeElevenLabsKey,
  onChangeChatLog,
  onChangeElevenLabsParam,
  onChangeKoeiromapParam,
  handleClickResetChatLog,
  handleClickResetSystemPrompt,
  backgroundImage,
  onChangeBackgroundImage,
  onChatMessage,
  onTokensUpdate,
  onChangeOpenRouterKey,
}: Props) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const { viewer } = useContext(ViewerContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedBackground = localStorage.getItem("backgroundImage");
    if (savedBackground) onChangeBackgroundImage(savedBackground);
  }, [onChangeBackgroundImage]);

  const handleChangeSystemPrompt = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => onChangeSystemPrompt(event.target.value),
    [onChangeSystemPrompt]
  );

  const handleAiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChangeAiKey(event.target.value),
    [onChangeAiKey]
  );

  const handleElevenLabsKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChangeElevenLabsKey(event.target.value),
    [onChangeElevenLabsKey]
  );

  const handleElevenLabsVoiceChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => onChangeElevenLabsParam({ voiceId: event.target.value }),
    [onChangeElevenLabsParam]
  );

  const handleChangeKoeiroParam = useCallback(
    (x: number, y: number) => onChangeKoeiromapParam({ speakerX: x, speakerY: y }),
    [onChangeKoeiromapParam]
  );

  const handleClickOpenVrmFile = useCallback(() => fileInputRef.current?.click(), []);

  const handleChangeVrmFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.name.split(".").pop() === "vrm") {
        const url = URL.createObjectURL(new Blob([file], { type: "application/octet-stream" }));
        viewer.loadVrm(url);
      }
      event.target.value = "";
    },
    [viewer]
  );

  return (
    <>
      <div className="absolute z-10 m-24">
        <div className="grid grid-flow-col gap-[8px]">
          <IconButton iconName="24/Menu" label="Settings" isProcessing={false} onClick={() => setShowSettings(true)} />
          {showChatLog ? (
            <IconButton iconName="24/CommentOutline" label="Conversation Log" isProcessing={false} onClick={() => setShowChatLog(false)} />
          ) : (
            <IconButton iconName="24/CommentFill" label="Conversation Log" isProcessing={false} disabled={chatLog.length <= 0} onClick={() => setShowChatLog(true)} />
          )}
        </div>
      </div>

      {showChatLog && <ChatLog messages={chatLog} />}
      {showSettings && (
        <Settings
          openAiKey={openAiKey}
          elevenLabsKey={elevenLabsKey}
          openRouterKey={openRouterKey}
          elevenLabsParam={elevenLabsParam}
          chatLog={chatLog as MessageWithChat[]} // ✅ Cast al tipo correcto
          systemPrompt={systemPrompt}
          koeiroParam={koeiroParam}
          onClickClose={() => setShowSettings(false)}
          onChangeAiKey={handleAiKeyChange}
          onChangeElevenLabsKey={handleElevenLabsKeyChange}
          onChangeElevenLabsVoice={handleElevenLabsVoiceChange}
          onChangeSystemPrompt={handleChangeSystemPrompt}
          onChangeChatLog={onChangeChatLog}
          onChangeKoeiroParam={handleChangeKoeiroParam}
          onClickOpenVrmFile={handleClickOpenVrmFile}
          onClickResetChatLog={handleClickResetChatLog}
          onClickResetSystemPrompt={handleClickResetSystemPrompt}
          backgroundImage={backgroundImage}
          onChangeBackgroundImage={onChangeBackgroundImage}
          onTokensUpdate={onTokensUpdate}
          onChatMessage={onChatMessage}
          onChangeOpenRouterKey={onChangeOpenRouterKey}
        />
      )}

      {!showChatLog && assistantMessage && <AssistantText message={assistantMessage} />}
      <input type="file" className="hidden" accept=".vrm" ref={fileInputRef} onChange={handleChangeVrmFile} />
    </>
  );
};
