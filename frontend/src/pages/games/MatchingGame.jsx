import GenericGame from "../../components/GenericGame";

export default function MatchingGame() {
  return (
    <GenericGame
      gameCode="matching"
      gameName="Shape Matching"
      gameIconName="shape-square"
      trialCount={20}
      multiSelect={false}
    />
  );
}
