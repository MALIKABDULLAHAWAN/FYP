/**
 * GenericGame – Enhanced reusable game session component.
 * 
 * DEPRECATED: This component is being replaced by the enhanced GameInterface component.
 * New games should use GameInterface for better therapeutic photograph integration,
 * progress indicators, difficulty adjustment, and completion screens.
 * 
 * Props:
 *   gameCode: string
 *   gameName: string (display name)
 *   gameIconName: string (UiIcon name under public/ui-icons/)
 *   trialCount: number (default 10)
 *   multiSelect: boolean (default false — set true for object_discovery)
 */
import GameInterface from "./GameInterface";

export default function GenericGame(props) {
  // Forward all props to the enhanced GameInterface component
  return <GameInterface {...props} />;
}
