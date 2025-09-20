import React, { useEffect, useState } from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";
import { getVoices } from "@/features/elevenlabs/elevenlabs";
import { ElevenLabsParam } from "@/features/constants/elevenLabsParam";
import { RestreamTokens } from "./restreamTokens";
import { Link } from "./link";

type Props = {
  openAiKey: string;
  elevenLabsKey: string;
  openRouterKey: string;
  systemPrompt: string;
  chatLog: Message[];
  elevenLabsParam: ElevenLabsParam;
  onClickClose: () => void;
  onChangeAiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeOpenRouterKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeElevenLabsKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeElevenLabsVoice: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onClickOpenVrmFile: () => void;
  onClickResetChatLog: () => void;
  onClickResetSystemPrompt: () => void;
  backgroundImage: string;
  onChangeBackgroundImage: (image: string) => void;
  onRestreamTokensUpdate?: (tokens: { access_token: string; refresh_token: string } | null) => void;
  onTokensUpdate: (tokens: any) => void;
  onChatMessage: (message: string) => void;
};

export const Settings = (props: Props) => {
  const {
    elevenLabsKey,
    elevenLabsParam,
    openRouterKey,
    systemPrompt,
    chatLog,
    onClickClose,
    onChangeOpenRouterKey,
    onChangeElevenLabsKey,
    onChangeElevenLabsVoice,
    onClickOpenVrmFile,
    onClickResetSystemPrompt,
    onChangeSystemPrompt,
    onChangeChatLog,
    onClickResetChatLog,
    backgroundImage,
    onChangeBackgroundImage,
    onTokensUpdate,
    onChatMessage,
  } = props;

  const [elevenLabsVoices, setElevenLabsVoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("personality");

  useEffect(() => {
    if (elevenLabsKey) {
      getVoices(elevenLabsKey).then((data) => {
        if (data?.voices) setElevenLabsVoices(data.voices);
      });
    }
  }, [elevenLabsKey]);

  return (
    <div className="absolute z-40 w-full h-full bg-white/80 backdrop-blur">
      <div className="absolute m-24">
        <IconButton iconName="24/Close" isProcessing={false} onClick={onClickClose} />
      </div>

      <div className="max-h-full overflow-auto">
        <div className="text-text1 max-w-3xl mx-auto px-24 py-64">
          <div className="my-24 typography-32 font-bold">Settings</div>

          {/* Tabs */}
          <div className="flex gap-8 border-b mb-24">
            {[
              { id: "personality", label: "Personalidad" },
              { id: "voices", label: "Voces" },
              { id: "vrm", label: "Personaje VRM" },
              { id: "streaming", label: "Transmisión" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-8 ${activeTab === tab.id ? "border-b-2 border-blue-500 font-bold" : "text-gray-500"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Personalidad */}
          {activeTab === "personality" && (
            <div>
              <div className="my-16 typography-20 font-bold">OpenRouter API</div>
              <input
                type="text"
                placeholder="OpenRouter API key"
                value={openRouterKey}
                onChange={onChangeOpenRouterKey}
                className="my-4 px-16 py-8 w-full bg-surface3 rounded-4"
              />
              <div className="mt-8">
                Character Settings (System Prompt)
                <TextButton onClick={onClickResetSystemPrompt}>Reset</TextButton>
                <textarea
                  value={systemPrompt}
                  onChange={onChangeSystemPrompt}
                  className="w-full h-168 px-16 py-8 bg-surface1 rounded-8"
                />
              </div>
            </div>
          )}

          {/* Voces */}
          {activeTab === "voices" && (
            <div>
              <div className="my-16 typography-20 font-bold">ElevenLabs API</div>
              <input
                type="text"
                placeholder="ElevenLabs API key"
                value={elevenLabsKey}
                onChange={onChangeElevenLabsKey}
                className="my-4 px-16 py-8 w-full bg-surface3 rounded-4"
              />
              <div className="my-16">Select Voice</div>
              <select className="h-40 px-8" onChange={onChangeElevenLabsVoice} value={elevenLabsParam.voiceId}>
                {elevenLabsVoices.map((voice, i) => (
                  <option key={i} value={voice.voice_id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Personaje VRM */}
          {activeTab === "vrm" && (
            <div>
              <div className="my-16 typography-20 font-bold">Character Model</div>
              <TextButton onClick={onClickOpenVrmFile}>Upload VRM</TextButton>

              <div className="mt-16">
                <div className="font-bold">Background Image</div>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = reader.result as string;
                      onChangeBackgroundImage(base64);
                      localStorage.setItem("backgroundImage", base64);
                    };
                    reader.readAsDataURL(file);
                  }
                }} />
                {backgroundImage && (
                  <div className="mt-8">
                    <img src={backgroundImage} alt="preview" className="max-w-[200px] rounded-4" />
                    <TextButton onClick={() => { onChangeBackgroundImage(""); localStorage.removeItem("backgroundImage"); }}>
                      Remove
                    </TextButton>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transmisión */}
          {activeTab === "streaming" && (
            <RestreamTokens onTokensUpdate={onTokensUpdate} onChatMessage={onChatMessage} />
          )}

          {/* Historial de chat (común a todas las pestañas) */}
          {chatLog.length > 0 && (
            <div className="my-40">
              <div className="typography-20 font-bold">Conversation History</div>
              <TextButton onClick={onClickResetChatLog}>Reset</TextButton>
              {chatLog.map((msg, i) => (
                <input
                  key={i}
                  value={msg.content}
                  className="w-full bg-surface1 px-16 py-8 rounded-8 my-4"
                  onChange={(e) => onChangeChatLog(i, e.target.value)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
