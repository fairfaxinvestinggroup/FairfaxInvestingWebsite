import { useMemo } from 'react'
import { Effect } from 'postprocessing'
import { Uniform, Vector2, WebGLRenderTarget, WebGLRenderer } from 'three'

// Adapted from niccolofanton/dithering-shader (MIT).
// https://github.com/niccolofanton/dithering-shader
const fragmentShader = /* glsl */ `
  uniform vec2 resolution;
  uniform float gridSize;
  uniform float pixelSizeRatio;
  uniform float grayscaleOnly;
  uniform float invertColor;

  float getThreshold(vec2 position) {
    vec2 pixel = floor(mod(position / gridSize, 4.0));
    int x = int(pixel.x);
    int y = int(pixel.y);

    if (x == 0) {
      if (y == 0) return 16.0 / 17.0;
      if (y == 1) return 5.0 / 17.0;
      if (y == 2) return 13.0 / 17.0;
      return 1.0 / 17.0;
    } else if (x == 1) {
      if (y == 0) return 8.0 / 17.0;
      if (y == 1) return 12.0 / 17.0;
      if (y == 2) return 4.0 / 17.0;
      return 9.0 / 17.0;
    } else if (x == 2) {
      if (y == 0) return 14.0 / 17.0;
      if (y == 1) return 2.0 / 17.0;
      if (y == 2) return 15.0 / 17.0;
      return 3.0 / 17.0;
    }

    if (y == 0) return 6.0 / 17.0;
    if (y == 1) return 10.0 / 17.0;
    if (y == 2) return 7.0 / 17.0;
    return 11.0 / 17.0;
  }

  void mainImage(
    const in vec4 inputColor,
    const in vec2 uv,
    out vec4 outputColor
  ) {
    vec2 fragCoord = uv * resolution;
    float pixelSize = gridSize * pixelSizeRatio;
    vec2 pixelatedUv =
      floor(fragCoord / pixelSize) * pixelSize / resolution;
    vec4 sampledColor = texture2D(inputBuffer, pixelatedUv);
    vec3 baseColor = sampledColor.rgb;

    float surfaceLuminance =
      dot(baseColor, vec3(0.2126, 0.7152, 0.0722));
    float luminance =
      mix(1.0, surfaceLuminance, sampledColor.a);
    float threshold = getThreshold(fragCoord);
    float scaledLuminance = clamp(luminance, 0.0, 1.0) * 2.0;
    float lowerLevel = floor(scaledLuminance);
    float grayscaleLevel = clamp(
      (lowerLevel + step(threshold, fract(scaledLuminance))) / 2.0,
      0.0,
      1.0
    );
    bool dithered = luminance < threshold;

    if (grayscaleOnly > 0.0) {
      baseColor = vec3(grayscaleLevel);
    } else if (dithered) {
      baseColor = vec3(0.0);
    }

    if (invertColor > 0.0) {
      baseColor = 1.0 - baseColor;
    }

    float outputAlpha =
      grayscaleOnly > 0.0
        ? (grayscaleLevel < 0.999 ? 1.0 : 0.0)
        : sampledColor.a;
    outputColor = vec4(baseColor, outputAlpha);
  }
`

type DitherOptions = {
  gridSize: number
  pixelSizeRatio: number
  grayscaleOnly: boolean
  invertColor: boolean
}

class DitherEffectImpl extends Effect {
  constructor(options: DitherOptions) {
    super('DitherEffect', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['resolution', new Uniform(new Vector2(1, 1))],
        ['gridSize', new Uniform(options.gridSize)],
        ['pixelSizeRatio', new Uniform(options.pixelSizeRatio)],
        ['grayscaleOnly', new Uniform(options.grayscaleOnly ? 1 : 0)],
        ['invertColor', new Uniform(options.invertColor ? 1 : 0)],
      ]),
    })
  }

  update(
    _renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget,
  ) {
    const resolution = this.uniforms.get('resolution')?.value as Vector2
    resolution.set(inputBuffer.width, inputBuffer.height)
  }
}

type DitherEffectProps = {
  gridSize?: number
  pixelSizeRatio?: number
  grayscaleOnly?: boolean
  invertColor?: boolean
}

export function DitherEffect({
  gridSize = 4,
  pixelSizeRatio = 1,
  grayscaleOnly = true,
  invertColor = false,
}: DitherEffectProps) {
  const effect = useMemo(
    () =>
      new DitherEffectImpl({
        gridSize,
        pixelSizeRatio,
        grayscaleOnly,
        invertColor,
      }),
    [gridSize, grayscaleOnly, invertColor, pixelSizeRatio],
  )

  return <primitive object={effect} dispose={null} />
}
