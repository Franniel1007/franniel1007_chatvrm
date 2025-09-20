"use client";

import { useEffect, useState } from "react";
import { IconButton } from "@/components/IconButton";
import { Link } from "@/components/Link";
import { RestreamTokens } from "@/components/RestreamTokens";
import { getVoices } from "@/lib/elevenlabs";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  elevenLabsKey: string;
  elevenLabsParam: any;
  openRouterKey: string;
  systemPrompt: string;
  chatLog: { role: string; content: string }[];
  backgroundImage: string | null;
  onClickClose: () => void;
  onChangeOpenRouterKey: (val: string) => void;
  onChangeElevenLabsKey: (val: string) => void;
  onChangeElevenLabsVoice: (val: string) => void;
  onClickOpenVrmFile: () => void;
  onClickResetSystemPrompt: () => void;
  onChangeSystemPrompt: (val: string) => void;
  onChangeChatLog: (val: { role: string; content: string }[]) => void;
  onClickResetChatLog: () => void;
  onChangeBackgroundImage: (val: string | null) => void;
  onTokensUpdate: (tokens: number) => void;
  onChatMessage: (message: string) => void;
};

export const Settings = (props: Props) => {
  const {
    elevenLabsKey,
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
    onTokensUpdate,
    onChatMessage,
  } = props;

  const [elevenLabsVoices, setElevenLabsVoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("personality");

  // Guardar pestaña activa en localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem("settings-active-tab");
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    localStorage.setItem("settings-active-tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (elevenLabsKey) {
      getVoices(elevenLabsKey).then((data) => {
        if (data?.voices) setElevenLabsVoices(data.voices);
      });
    }
  }, [elevenLabsKey]);

  const tabs = [
    { id: "personality", label: "Personalidad" },
    { id: "voices", label: "Voces" },
    { id: "vrm", label: "Personaje VRM" },
    { id: "streaming", label: "Transmisión" },
    { id: "history", label: "Historial" },
    { id: "about", label: "Acerca de" },
  ];

  return (
    <motion.div
      className="absolute z-40 w-full h-full bg-white/80 backdrop-blur"
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute m-6">
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={onClickClose}
        />
      </div>

      <div className="max-h-full overflow-auto">
        <div className="text-text1 max-w-3xl mx-auto px-6 py-20">
          <div className="my-8 typography-32 font-bold">Settings</div>

          {/* Tabs */}
          <div className="flex gap-6 border-b mb-10 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 px-4 transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-500 font-bold text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contenido con animación */}
          <AnimatePresence mode="wait">
            {activeTab === "personality" && (
              <motion.div
                key="personality"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="my-4">
                  <label className="font-bold block mb-2">System Prompt</label>
                  <textarea
                    className="w-full border rounded p-2"
                    value={systemPrompt}
                    onChange={(e) => onChangeSystemPrompt(e.target.value)}
                  />
                  <button
                    className="mt-2 text-sm text-red-500"
                    onClick={onClickResetSystemPrompt}
                  >
                    Resetear prompt
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "voices" && (
              <motion.div
                key="voices"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div>
                  <label className="block mb-2">OpenRouter API</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2 mb-4"
                    value={openRouterKey}
                    onChange={(e) => onChangeOpenRouterKey(e.target.value)}
                  />
                  <label className="block mb-2">ElevenLabs API</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2 mb-4"
                    value={elevenLabsKey}
                    onChange={(e) => onChangeElevenLabsKey(e.target.value)}
                  />
                  <label className="block mb-2">Voice Selection</label>
                  <select
                    className="w-full border rounded p-2"
                    onChange={(e) => onChangeElevenLabsVoice(e.target.value)}
                  >
                    {elevenLabsVoices.map((voice) => (
                      <option key={voice.voice_id} value={voice.voice_id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {activeTab === "vrm" && (
              <motion.div
                key="vrm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={onClickOpenVrmFile}
                  className="bg-purple-600 text-white rounded px-4 py-2"
                >
                  Open VRM
                </button>
              </motion.div>
            )}

            {activeTab === "streaming" && (
              <motion.div
                key="streaming"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <RestreamTokens
                  onTokensUpdate={onTokensUpdate}
                  onChatMessage={onChatMessage}
                />
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="my-4">
                  <h2 className="font-bold mb-2">Historial de la conversación</h2>
                  {chatLog.length === 0 ? (
                    <p className="text-gray-500">No hay mensajes aún.</p>
                  ) : (
                    <ul className="border rounded p-2 bg-gray-50 max-h-60 overflow-auto">
                      {chatLog.map((msg, i) => (
                        <li key={i} className="mb-1">
                          <strong>{msg.role}:</strong> {msg.content}
                        </li>
                      ))}
                    </ul>
                  )}
                  {chatLog.length > 0 && (
                    <button
                      className="mt-2 text-sm text-red-500"
                      onClick={onClickResetChatLog}
                    >
                      Borrar historial
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center my-10 text-gray-800">
                  <div className="typography-20 font-bold mb-4">Acerca de</div>
                  <p className="mb-2">
                    ChatVRM by <strong>FrannielMedina</strong>
                  </p>
                  <p className="mb-2">
                    Fork creado a partir de{" "}
                    <Link
                      url="https://github.com/zoan37/ChatVRM"
                      label="zoan37/ChatVRM"
                    />
                  </p>
                  <p className="mb-2">Inspirado por Pixiv, OpenRouter y ElevenLabs</p>
                  <p className="text-sm text-gray-600">
                    (C)2025 Franniel Medina - Todos los derechos reservados
                  </p>
                  <p className="mt-4">
                    <Link
                      url="https://github.com/Franniel1007/franniel1007_chatvrm"
                      label="Ver en GitHub"
                    />
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
