import GameInterface from "../components/GameInterface";
import { clearToken, getToken } from "../api/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function JaGame() {
  const nav = useNavigate();

  // Stable auth redirect
  useEffect(() => {
    if (!getToken()) nav("/login");
  }, [nav]);

  function logout() {
    clearToken();
    nav("/login");
  }

  // Use the enhanced GameInterface for Joint Attention game
  return (
    <GameInterface
      gameCode="ja"
      gameName="Joint Attention"
      gameIconName="eye"
      trialCount={20}
      multiSelect={false}
    />
  );
}
