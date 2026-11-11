import { useThree } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";

// drei loaders (useGLTF, useTexture, Environment) suspend while they fetch.
// Remotion would screenshot the empty fallback, so the frame is held with
// delayRender until everything inside has loaded and been drawn once.

const Ready: React.FC<{ handle: number }> = ({ handle }) => {
  const advance = useThree((s) => s.advance);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    // Draw the now-complete scene once, then release the frame.
    invalidate();
    advance(0, true);
    continueRender(handle);
  }, [advance, invalidate, handle]);
  return null;
};

export const AssetGate: React.FC<{ children: React.ReactNode; label?: string }> = ({
  children,
  label = "3D assets",
}) => {
  const [handle] = useState(() => delayRender(`Loading ${label}`, { timeoutInMilliseconds: 120000 }));
  return (
    <Suspense fallback={null}>
      {children}
      <Ready handle={handle} />
    </Suspense>
  );
};
