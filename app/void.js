/* The Void: one full-screen fragment shader. A slow polar vortex rendered with
 * domain-warped fbm. Colour follows the selected objective's standing; the
 * surface flares it on a meaningful change. No library. Degrades to a CSS
 * gradient when WebGL is unavailable. */
(function () {
  const cv = document.getElementById("void");
  const gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false, powerPreference: "high-performance" });
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const api = { color: [0.25, 0.62, 1.0], target: [0.25, 0.62, 1.0], energy: 0, center: [0.5, 0.42], tCenter: [0.5, 0.42] };
  window.Void = {
    tint(rgb) { api.target = rgb; },
    surge(n = 1) { api.energy = Math.min(2.2, api.energy + n); },
    focus(x, y) { api.tCenter = [x, y]; },
  };
  if (!gl) { document.body.classList.add("no-gl"); return; }

  const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fs = `precision highp float;
  uniform vec2 R; uniform float T; uniform vec3 C; uniform float E; uniform vec2 O;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<6;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
  void main(){
    vec2 uv=(gl_FragCoord.xy-O*R)/R.y;
    float r=length(uv), a=atan(uv.y,uv.x);
    float t=T*.045;
    float tw=a+1.6/(r+.18)+t*2.;
    vec2 q=vec2(cos(tw),sin(tw))*(r*3.)+vec2(t,-t);
    vec2 w=vec2(fbm(q+t),fbm(q+vec2(5.2,1.3)-t));
    float f=fbm(q+2.2*w);
    float ring=exp(-pow((r-.34)*7.,2.))*(.5+.8*f);
    float core=exp(-r*5.5)*1.1;
    float arms=smoothstep(.45,.95,f)*exp(-r*1.6);
    float rim=exp(-pow((r-.345)*60.,2.))*(.55+.35*sin(a*24.+T*1.2));
    float i=(ring+arms*.85+core*.45+rim*.7)*(1.+E*.85);
    vec3 col=C*i*1.05+vec3(.85,.95,1.)*pow(max(i-.9,0.),2.)*.55;
    vec2 g=gl_FragCoord.xy/14.; float s=h(floor(g)); float tw2=.5+.5*sin(T*1.7+s*40.);
    col+=C*step(.995,s)*tw2*.6;
    vec2 v=gl_FragCoord.xy/R-.5; col*=1.-dot(v,v)*1.7;
    col=pow(col,vec3(.92));
    col=col/(1.+col*.55);
    gl_FragColor=vec4(col*.92,1.);
  }`;
  function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const pr = gl.createProgram();
  try {
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
  } catch (error) {
    console.warn(error);
    document.body.classList.add("no-gl");
    return;
  }
  gl.linkProgram(pr);
  gl.useProgram(pr);
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (k) => gl.getUniformLocation(pr, k);
  const uR = U("R"), uT = U("T"), uC = U("C"), uE = U("E"), uO = U("O");

  function size() {
    const d = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = innerWidth * d;
    cv.height = innerHeight * d;
    gl.viewport(0, 0, cv.width, cv.height);
  }
  addEventListener("resize", size);
  size();
  const t0 = performance.now();
  let last = t0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (let i = 0; i < 3; i++) api.color[i] += (api.target[i] - api.color[i]) * Math.min(1, dt * 2.4);
    for (let i = 0; i < 2; i++) api.center[i] += (api.tCenter[i] - api.center[i]) * Math.min(1, dt * 2.2);
    api.energy *= Math.pow(0.35, dt);
    gl.uniform2f(uR, cv.width, cv.height);
    gl.uniform1f(uT, reduce ? 12 : (now - t0) / 1000);
    gl.uniform3fv(uC, api.color);
    gl.uniform1f(uE, api.energy);
    gl.uniform2fv(uO, [api.center[0], 1 - api.center[1]]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce || api.energy > 0.02) requestAnimationFrame(frame);
    else setTimeout(() => requestAnimationFrame(frame), 500);
  }
  requestAnimationFrame(frame);
})();
