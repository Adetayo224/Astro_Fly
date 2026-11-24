export type Quality = "low" | "mid" | "high"

/** null when WebGL is unavailable; otherwise whether rendering runs on a real GPU. */
export function probeWebGL(): { software: boolean } | null {
  try {
    const c = document.createElement("canvas")
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null
    if (!gl) return null
    const ext = gl.getExtension("WEBGL_debug_renderer_info")
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ""
    gl.getExtension("WEBGL_lose_context")?.loseContext()
    return { software: /swiftshader|llvmpipe|software|basic render/i.test(renderer) }
  } catch {
    return null
  }
}

/** Rough device tier so weak phones and data saver users get a lighter scene. */
export function detectQuality(): Quality {
  if (typeof navigator === "undefined") return "mid"
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean; effectiveType?: string }
  }
  const cores = nav.hardwareConcurrency || 4
  const mem = nav.deviceMemory || 4
  const conn = nav.connection
  const small = window.innerWidth < 768
  if (conn?.saveData || /(^|-)2g|3g/.test(conn?.effectiveType || "")) return "low"
  if (cores <= 4 || mem <= 3) return "low"
  if (small || cores <= 6 || mem <= 4) return "mid"
  return "high"
}
