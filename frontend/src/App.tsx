import { Stage } from "./components/Stage";
import { Office } from "./screens/Office";
import { Results } from "./screens/Results";
import { Title } from "./screens/Title";
import { useGame } from "./store/game";

/**
 * No router: one `screen` value in the store decides what shows
 * (docs/frontend-spec.md, "Screens").
 */
export function App() {
  const screen = useGame((s) => s.screen);

  return (
    <Stage>
      {screen === "title" && <Title />}
      {screen === "office" && <Office />}
      {screen === "results" && <Results />}
    </Stage>
  );
}
