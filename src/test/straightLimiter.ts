/**
 * Makes the safety limiter's curve a straight line on an engine built on `ctx` from now on, so what a render gives is
 * what reaches the limiter (review 14's method): ±4 in, ±4 out. The limiter's curve is the one longer than the LFOs'
 * two-point clamp that passes negative values (a pulse's cycle, issue 98, is all positive). An error value passes it
 * as it is.
 */
export function straightenLimiter(ctx: BaseAudioContext) {
  const shaper = ctx.createWaveShaper.bind(ctx);
  const curve = Object.getOwnPropertyDescriptor(WaveShaperNode.prototype, 'curve')!;
  ctx.createWaveShaper = () => {
    const node = shaper();
    Object.defineProperty(node, 'curve', {
      get: () => curve.get!.call(node),
      set: (c: Float32Array) => curve.set!.call(node, c.length > 2 && c[0] < 0 ? Float32Array.of(-4, 4) : c),
    });
    return node;
  };
}
