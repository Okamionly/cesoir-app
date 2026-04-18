"use client";

import { useEffect, useRef } from "react";

/**
 * PlasmaOcean — flowing fluid shader background
 *
 * Inspired by the Claude Design "Plasma Ocean" wallpaper.
 * Pure WebGL fragment shader, no Three.js dependency.
 *
 * Visual: layered simplex noise producing a cyan/violet/green fluid
 * that flows like an aurora borealis on an ocean surface.
 * Mouse position warps the flow, clicks send ripples.
 *
 * Tuned for CeSoir palette (violet #8B5CF6 + vert #00FF88 + rose #EC4899).
 */
export default function PlasmaOcean({
  className = "",
  speed = 0.6,
  opacity = 1,
  palette = "cesoir",
}: {
  className?: string;
  speed?: number;
  opacity?: number;
  palette?: "cesoir" | "ocean";
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<[number, number]>([0.5, 0.5]);
  const ripplesRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) {
      console.warn("[PlasmaOcean] WebGL unsupported, falling back to gradient");
      return;
    }

    // ───────────────────────────────
    // Shaders
    // ───────────────────────────────
    const vertSrc = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // CeSoir palette: violet -> rose -> vert
    // Ocean palette: deep blue -> cyan -> bright
    const paletteGlsl =
      palette === "cesoir"
        ? `
          vec3 c1 = vec3(0.545, 0.361, 0.965); // #8B5CF6 violet
          vec3 c2 = vec3(0.925, 0.282, 0.600); // #EC4899 rose
          vec3 c3 = vec3(0.000, 1.000, 0.533); // #00FF88 vert fluo
          vec3 c0 = vec3(0.039, 0.039, 0.051); // #0A0A0D near-black
        `
        : `
          vec3 c1 = vec3(0.05, 0.10, 0.35);
          vec3 c2 = vec3(0.10, 0.40, 0.75);
          vec3 c3 = vec3(0.35, 0.90, 1.00);
          vec3 c0 = vec3(0.02, 0.03, 0.08);
        `;

    const fragSrc = `
      precision highp float;

      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;
      uniform vec4 u_ripples[8]; // x, y, age, strength
      uniform int u_rippleCount;

      // ───────── simplex noise 2D ─────────
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      // fractal brownian motion
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * snoise(p);
          p *= 2.1;
          a *= 0.5;
        }
        return v;
      }

      ${paletteGlsl}

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = uv - 0.5;
        p.x *= u_resolution.x / u_resolution.y;

        float t = u_time * 0.3;

        // Mouse warp
        vec2 m = u_mouse - 0.5;
        m.x *= u_resolution.x / u_resolution.y;
        float md = distance(p, m);
        vec2 warp = normalize(p - m) * 0.08 * exp(-md * 3.0);

        // Layered noise (flowing fluid)
        vec2 q = p + warp;
        float n1 = fbm(q * 1.8 + vec2(t, t * 0.6));
        float n2 = fbm(q * 3.5 + vec2(-t * 0.7, t * 0.4) + n1);
        float n3 = fbm(q * 6.0 + vec2(t * 1.2, -t * 0.8) + n2 * 0.5);

        float flow = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
        flow = flow * 0.5 + 0.5; // [0, 1]

        // Mouse glow
        float glow = exp(-md * 2.5) * 0.3;

        // Ripples
        float ripple = 0.0;
        for (int i = 0; i < 8; i++) {
          if (i >= u_rippleCount) break;
          vec2 rp = u_ripples[i].xy - 0.5;
          rp.x *= u_resolution.x / u_resolution.y;
          float rd = distance(p, rp);
          float age = u_ripples[i].z;
          float str = u_ripples[i].w;
          ripple += sin(rd * 40.0 - age * 8.0) * exp(-rd * 3.0) * exp(-age * 1.5) * str * 0.15;
        }
        flow += ripple;

        // Color gradient: c0 -> c1 -> c2 -> c3
        vec3 color;
        if (flow < 0.4) {
          color = mix(c0, c1, smoothstep(0.0, 0.4, flow));
        } else if (flow < 0.7) {
          color = mix(c1, c2, smoothstep(0.4, 0.7, flow));
        } else {
          color = mix(c2, c3, smoothstep(0.7, 1.0, flow));
        }

        color += glow * c3;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // ───────────────────────────────
    // Compile
    // ───────────────────────────────
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("[PlasmaOcean] shader compile error:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vert = compile(gl.VERTEX_SHADER, vertSrc);
    const frag = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vert || !frag) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[PlasmaOcean] link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uRipples = gl.getUniformLocation(program, "u_ripples");
    const uRippleCount = gl.getUniformLocation(program, "u_rippleCount");

    // ───────────────────────────────
    // Resize
    // ───────────────────────────────
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ───────────────────────────────
    // Mouse / touch
    // ───────────────────────────────
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = [
        (e.clientX - r.left) / r.width,
        1 - (e.clientY - r.top) / r.height,
      ];
    };
    const onClick = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ripplesRef.current.push({
        x: (e.clientX - r.left) / r.width,
        y: 1 - (e.clientY - r.top) / r.height,
        t: 0,
      });
      if (ripplesRef.current.length > 8) ripplesRef.current.shift();
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onClick);

    // ───────────────────────────────
    // Render loop
    // ───────────────────────────────
    startTimeRef.current = performance.now();
    let raf = 0;
    const render = () => {
      const now = performance.now();
      const elapsed = ((now - startTimeRef.current) / 1000) * speed;

      // Age ripples
      ripplesRef.current = ripplesRef.current
        .map((r) => ({ ...r, t: r.t + 1 / 60 }))
        .filter((r) => r.t < 3);

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseRef.current[0], mouseRef.current[1]);
      gl.uniform1f(uTime, elapsed);

      // Pack ripples into vec4 array (x, y, age, strength)
      const rippleData = new Float32Array(8 * 4);
      ripplesRef.current.forEach((r, i) => {
        if (i >= 8) return;
        rippleData[i * 4] = r.x;
        rippleData[i * 4 + 1] = r.y;
        rippleData[i * 4 + 2] = r.t;
        rippleData[i * 4 + 3] = 1;
      });
      gl.uniform4fv(uRipples, rippleData);
      gl.uniform1i(uRippleCount, ripplesRef.current.length);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };

    // Pause when tab hidden (battery saver)
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(raf);
      } else {
        startTimeRef.current = performance.now() - (startTimeRef.current ? 0 : 0);
        raf = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onClick);
      ro.disconnect();
    };
  }, [speed, palette]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        opacity,
        pointerEvents: "auto",
      }}
      aria-hidden="true"
    />
  );
}
