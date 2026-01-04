const vertexShader = `
    attribute vec2 pos;
    attribute vec2 tex;
    varying vec2 vTex;
    void main() {
      gl_Position = vec4(pos, 0.0, 1.0);
      vTex = tex;
    }
  `;

const fragmentShader = `
    precision mediump float;
    uniform sampler2D img;
    uniform sampler2D lbl;
    uniform float selLabel;
    uniform bool hasSel;
    varying vec2 vTex;
    
    void main() {
      vec4 imgColor = texture2D(img, vTex);
      float label = texture2D(lbl, vTex).r * 255.0;
      
      if (hasSel) {
        if (abs(label - selLabel) < 0.5) {
          gl_FragColor = imgColor;
        } else {
          gl_FragColor = imgColor * 0.3;
        }
      } else {
        gl_FragColor = imgColor;
      }
    }
  `;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);

  return program;
}

function setupGeometry(gl, program) {
  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);

  const vBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, "pos");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const tBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuf);
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
  const texLoc = gl.getAttribLocation(program, "tex");
  gl.enableVertexAttribArray(texLoc);
  gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
}

function createTexture(gl, data, width, height) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    data,
  );
  return tex;
}

export function initWebGL(canvas, imageData, labelData, width, height) {
  const gl = canvas.getContext("webgl");
  const program = createProgram(gl);

  setupGeometry(gl, program);

  gl.activeTexture(gl.TEXTURE0);
  createTexture(gl, imageData, width, height);
  gl.uniform1i(gl.getUniformLocation(program, "img"), 0);

  gl.activeTexture(gl.TEXTURE1);
  createTexture(gl, labelData, width, height);
  gl.uniform1i(gl.getUniformLocation(program, "lbl"), 1);

  return {
    gl,
    canvas,
    program,
    hlColorLoc: gl.getUniformLocation(program, "hlColor"),
    selLabelLoc: gl.getUniformLocation(program, "selLabel"),
    hasSelLoc: gl.getUniformLocation(program, "hasSel"),
  };
}

export function renderScene(ctx, selectedLabel) {
  const { gl, canvas, hlColorLoc, selLabelLoc, hasSelLoc } = ctx;

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (selectedLabel !== null) {
    gl.uniform1f(selLabelLoc, selectedLabel);
    gl.uniform1i(hasSelLoc, 1);
  } else {
    gl.uniform1i(hasSelLoc, 0);
  }

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
