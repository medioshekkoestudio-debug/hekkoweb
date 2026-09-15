// Logo oficial de Hekko. El archivo vive en public/brand/hekko-logo.png
// (original: src/img2/Logo-Hekko-Estudio-large.png, 2032×453).
const RATIO = 2032 / 453;

interface HekkoLogoProps {
  /** Alto en px; el ancho se calcula para respetar la proporción. */
  height?: number;
  style?: React.CSSProperties;
}

export default function HekkoLogo({ height = 32, style }: HekkoLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/hekko-logo.png"
      alt="Hekko"
      width={Math.round(height * RATIO)}
      height={height}
      style={{ display: 'block', height, width: 'auto', flexShrink: 0, ...style }}
    />
  );
}
