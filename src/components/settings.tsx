// src/components/settings.tsx
import React, { useEffect, useState } from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";
import { getVoices } from "@/features/elevenlabs/elevenlabs";
import { ElevenLabsParam } from "@/features/constants/elevenLabsParam";
import { KoeiroParam } from "@/features/constants/koeiroParam";
import { RestreamTokens } from "./restreamTokens";
import { Link } from "./link";

type Props = {
  openAiKey: string;
  elevenLabsKey: string;
  openRouterKey: string;
  systemPrompt: string;
  chatLog: Message[];
  elevenLabsParam: ElevenLabsParam;
  koeiroParam: KoeiroParam;
  onClickClose: () => void;
  onChangeAiKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeOpenRouterKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeElevenLabsKey: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeElevenLabsVoice: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeKoeiroParam: (x: number, y: number) => void;
  onClickOpenVrmFile: () => void;
  onClickResetChatLog: () => void;
  onClickResetSystemPrompt: () => void;
  backgroundImage: string;
  onChangeBackgroundImage: (image: string) => void;
  onTokensUpdate: (tokens: any) => void;
  onChatMessage: (message: string) => void;
};

export const Settings = ({
  openAiKey,
  elevenLabsKey,
  openRouterKey,
  chatLog,
  systemPrompt,
  elevenLabsParam,
  koeiroParam,
  onClickClose,
  onChangeSystemPrompt,
  onChangeAiKey,
  onChangeOpenRouterKey,
  onChangeElevenLabsKey,
  onChangeElevenLabsVoice,
  onChangeChatLog,
  onChangeKoeiroParam,
  onClickOpenVrmFile,
  onClickResetChatLog,
  onClickResetSystemPrompt,
  backgroundImage,
  onChangeBackgroundImage,
  onTokensUpdate,
  onChatMessage,
}: Props) => {
  const [elevenLabsVoices, setElevenLabsVoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "personality" | "voices" | "vrm" | "streaming" | "history" | "about"
  >("personality");

  useEffect(() => {
    if (elevenLabsKey) {
      getVoices(elevenLabsKey)
        .then((data) => {
          if (data?.voices) {
            setElevenLabsVoices(data.voices);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch voices:", err);
          setElevenLabsVoices([]);
        });
    } else {
      setElevenLabsVoices([]);
    }
  }, [elevenLabsKey]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onChangeBackgroundImage(base64String);
        localStorage.setItem("backgroundImage", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = () => {
    onChangeBackgroundImage("");
    localStorage.removeItem("backgroundImage");
  };

  return (
    <div className="absolute z-40 w-full h-full bg-white/80 backdrop-blur ">
      <div className="absolute m-24">
        <IconButton iconName="24/Close" isProcessing={false} onClick={onClickClose} />
      </div>

      <div className="max-h-full overflow-auto">
        <div className="text-text1 max-w-3xl mx-auto px-24 py-64 ">
          <div className="my-24 typography-32 font-bold">Settings</div>

          {/* Tabs */}
          <div className="flex gap-4 md:gap-8 border-b mb-24 overflow-x-auto">
            {[
              { id: "personality", label: "Personalidad" },
              { id: "voices", label: "Voces" },
              { id: "vrm", label: "Personaje VRM" },
              { id: "streaming", label: "Transmisión" },
              { id: "history", label: "Historial" },
              { id: "about", label: "Acerca de" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-6 md:px-8 whitespace-nowrap ${
                  activeTab === tab.id ? "border-b-2 border-secondary font-bold" : "text-gray-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* PERSONALIDAD */}
          {activeTab === "personality" && (
            <div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">OpenRouter API</div>
                <input
                  type="text"
                  placeholder="OpenRouter API key"
                  value={openRouterKey}
                  onChange={onChangeOpenRouterKey}
                  className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
                />
              </div>

              <div className="my-24">
                <div className="my-8 typography-20 font-bold">Character Settings</div>
                <div className="my-8">
                  <TextButton onClick={onClickResetSystemPrompt}>Reset character settings</TextButton>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={onChangeSystemPrompt}
                  className="px-16 py-8  bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full"
                />
              </div>
            </div>
          )}

          {/* VOCES */}
          {activeTab === "voices" && (
            <div>
              <div className="my-24">
                <div className="my-16 typography-20 font-bold">Eleven Labs API</div>
                <input
                  type="text"
                  placeholder="ElevenLabs API key"
                  value={elevenLabsKey}
                  onChange={onChangeElevenLabsKey}
                  className="my-4 px-16 py-8 w-full h-40 bg-surface3 hover:bg-surface3-hover rounded-4 text-ellipsis"
                />
              </div>

              <div className="my-40">
                <div className="my-16 typography-20 font-bold">Voice Selection</div>
                <select
                  className="h-40 px-8"
                  onChange={onChangeElevenLabsVoice}
                  value={elevenLabsParam.voiceId}
                >
                  {elevenLabsVoices.length === 0 && <option value="">-- select voice --</option>}
                  {elevenLabsVoices.map((voice, index) => (
                    <option key={index} value={voice.voice_id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* VRM */}
          {activeTab === "vrm" && (
            <div>
              <div className="my-40">
                <div className="my-16 typography-20 font-bold">Character Model</div>
                <TextButton onClick={onClickOpenVrmFile}>Open VRM</TextButton>
              </div>

              <div className="my-40">
                <div className="my-16 typography-20 font-bold">Background Image</div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="my-4" />
                {backgroundImage && (
                  <div className="my-8">
                    <img src={backgroundImage} alt="Background" className="max-w-[200px] rounded-4" />
                    <TextButton onClick={handleRemoveBackground}>Remove Background</TextButton>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STREAMING */}
          {activeTab === "streaming" && (
            <RestreamTokens onTokensUpdate={onTokensUpdate} onChatMessage={onChatMessage} />
          )}

          {/* HISTORIAL */}
          {activeTab === "history" && (
            <div>
              <div className="my-8 grid-cols-2">
                <div className="my-16 typography-20 font-bold">Conversation History</div>
                <TextButton onClick={onClickResetChatLog}>Reset conversation history</TextButton>
              </div>
              {chatLog.map((value, index) => (
                <div key={index} className="my-8 grid grid-cols-[min-content_1fr] gap-x-4">
                  <div className="w-[64px] py-8">{value.role === "assistant" ? "Character" : "You"}</div>
                  <input
                    className="bg-surface1 hover:bg-surface1-hover rounded-8 w-full px-16 py-8"
                    type="text"
                    value={value.content}
                    onChange={(event) => onChangeChatLog(index, event.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ACERCA DE */}
          {activeTab === "about" && (
            <div className="my-40 text-gray-800">
              <div className="typography-20 font-bold mb-6">Acerca de</div>
              <p className="mb-4">ChatVRM by <strong>FrannielMedina</strong></p>
              <p className="mb-4">
                Fork creado a partir de{" "}
                <Link url="https://github.com/zoan37/ChatVRM" label="https://github.com/zoan37/ChatVRM" />
              </p>
              <p className="mb-4">Inspirado por Pixiv, OpenRouter y ElevenLabs</p>
              <p className="text-sm text-gray-600">(C)2025 Franniel Medina - Todos los derechos reservados https://beacons.ai/frannielmedinatv</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
