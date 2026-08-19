import { Composition } from "remotion";
import { IpanStorePromo } from "./IpanStorePromo";
import { PanggilanJihad } from "./PanggilanJihad";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="IPANSTORE-LIVE-OVERLAY"
        component={IpanStorePromo}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={480}
        defaultProps={{ website: "ipanstore.id" }}
      />
      <Composition
        id="PANGGILAN-JIHAD-OVERLAY"
        component={PanggilanJihad}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={720}
        defaultProps={{ website: "ipanstore.id" }}
      />
    </>
  );
};
