import { useEffect, useRef } from "react";

const ANIMATION_PATH = "/motions/simbolo-atomo-quanton3d.json";

export default function AnimatedAtomLogo() {
  const containerRef = useRef(null);

  useEffect(() => {
    let animation;
    let active = true;

    async function carregarAnimacao() {
      const module = await import("lottie-web/build/player/lottie_light");
      const lottie = module.default ?? module;

      if (!active || !containerRef.current) return;

      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        autoplay: true,
        path: ANIMATION_PATH,
        rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
    }

    carregarAnimacao();

    return () => {
      active = false;
      animation?.destroy();
    };
  }, []);

  return <span ref={containerRef} className="qnav-logo qnav-logo--animated" aria-hidden="true" />;
}
