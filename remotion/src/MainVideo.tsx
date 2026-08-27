import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadSans } from "@remotion/google-fonts/Inter";

import { Intro } from "./scenes/Intro";
import { Chat } from "./scenes/Chat";
import { Painel } from "./scenes/Painel";
import { Fecho } from "./scenes/Fecho";

const { fontFamily: display } = loadDisplay("normal", { weights: ["600"], subsets: ["latin"] });
const { fontFamily: sans } = loadSans("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

export const MainVideo: React.FC = () => (
  <AbsoluteFill style={{ ["--display" as string]: display }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={100}>
        <Intro display={display} sans={sans} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 20 })} />
      <TransitionSeries.Sequence durationInFrames={220}>
        <Chat display={display} sans={sans} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 20 })} />
      <TransitionSeries.Sequence durationInFrames={230}>
        <Painel display={display} sans={sans} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 20 })} />
      <TransitionSeries.Sequence durationInFrames={100}>
        <Fecho display={display} sans={sans} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
