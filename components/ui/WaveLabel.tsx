interface WaveLabelProps {
  text: string;
  reducedMotion: boolean;
  step?: number;
}

export default function WaveLabel({
  text,
  reducedMotion,
  step = 0.07,
}: WaveLabelProps) {
  return (
    <>
      {text.split("").map((char, i) =>
        char === " " ? (
          <span key={i} className="inline-block">
            &nbsp;
          </span>
        ) : (
          <span
            key={i}
            className={reducedMotion ? "inline-block" : "label-wave-letter"}
            style={
              reducedMotion ? undefined : { animationDelay: `${i * step}s` }
            }
          >
            {char}
          </span>
        ),
      )}
    </>
  );
}
