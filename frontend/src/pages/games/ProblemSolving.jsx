import GenericGame from "../../components/GenericGame";

export default function ProblemSolving() {
  return (
    <GenericGame
      gameCode="problem_solving"
      gameName="Problem Solving"
      gameIconName="puzzle"
      trialCount={8}
      multiSelect={false}
    />
  );
}
