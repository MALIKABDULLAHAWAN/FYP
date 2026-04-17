import GenericGame from "../../components/GenericGame";

export default function ObjectDiscovery() {
  return (
    <GenericGame
      gameCode="object_discovery"
      gameName="Object Discovery"
      gameIconName="search"
      trialCount={20}
      multiSelect={true}
    />
  );
}
