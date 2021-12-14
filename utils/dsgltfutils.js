
async function readglTF(name) {
  let blob = await fetch(name).then(e => e.text());
  return JSON.parse(blob);
}

async function readglTFBin(name) {
  let blob = await fetch(name).then(e => e.arrayBuffer());
  return blob;
}


function output(indent, text) {
  let outi = "-";
  for (let i = 0; i < indent; i++)outi = "--" + outi;
  console.log(outi + text);
  let el = document.createElement("h" + (indent < 1 ? indent + 1 : 3));
  el.innerText = outi + text;
  document.body.append(el);
}

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
  // create GLSL shaders, upload the GLSL source, compile the shaders
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

/**
 * Create a new buffer, bind it to a specific type.
 * Then give data to the new buffer.
 * 
 * @param {context}   gl   - GL context from canvas
 * @param {various}   data - data to pass to buffer
 * @param {constant}  type - type of buffer to bind
 */
function makeBuffer(gl, data, type){
  let dataType;
  let bufferType = gl.ARRAY_BUFFER;
    // Guard against too few arguments
    if (data) {
      dataType = data;
    }
    if (type) {
        bufferType = type;
    }
    let buffer = gl.createBuffer();
    gl.bindBuffer(bufferType, buffer);
    gl.bufferData(bufferType, dataType, gl.STATIC_DRAW);

    return buffer;
}

/**
 * Helper function to get attribute location and couple it
 * with the given JS variable.
 * 
 * @param {context}   gl        - GL context from canvas
 * @param {porgram}   program   - program from shaders
 * @param {string}    attribute - attribute name as string
 * @param {num}       dataSize  - data size as integer
 * @param {constant}  dataType  - data type as constant
 * @param {boolean}   dataNorm  - boolean if data is normalized
 */
function pointAttributes(gl, program, attribute, dataSize, dataType, dataNorm){
    let attributeLocation = gl.getAttribLocation(program, attribute);

    let size = dataSize;
    let type = gl.FLOAT;
    // Guard against too few arguments
    if (dataType){
        type = dataType;
    }
    let normalize = false;
    // Guard against missing arguments
    if (dataNorm){
        normalize = dataNorm;
    }
    let stride = 0;
    let offset = 0;

    gl.vertexAttribPointer (attributeLocation, size, type, normalize, stride, offset);
    gl.enableVertexAttribArray(attributeLocation);
}

/**
 * Helper function to disable attribute location.
 * 
 * @param {context}   gl        - GL context from canvas
 * @param {porgram}   program   - program from shaders
 * @param {string}    attribute - attribute name as string
 */
function disableAttributes(gl, program, attribute){
    let attributeLocation = gl.getAttribLocation(program, attribute);
    gl.disableVertexAttribArray(attributeLocation);
}

/**
 * Helper Method to create textures.
 * @param {context}   gl    - GL context from canvas
 * @param {constact}  type  - data type as constant
 * @param {image}     image - image texture
 */
function makeTexture(gl, image, type, number) {
  // Create a texture ID.
  let texture = gl.createTexture();
  //Activate this ID as 2D Texture & set options
  let texType = (type) ? type : gl.TEXTURE_2D;
  let numType = (number) ? number : gl.UNSIGNED_BYTE;
  gl.bindTexture(texType, texture);
  gl.texImage2D(texType, 0, gl.RGB, gl.RGB, numType, image);
  gl.texParameteri(texType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(texType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(texType, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(texType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return texture;
}

/**
 * Helper Method to replace all integer 
 * indices with the object references.
 * @param {Array}   src - Full buffer array
 * @param {Scenes} dest - Copy from full array buffer 
 */
function replaceReference(src, dest) {
  for (let index = 0; index < dest.nodes.length; index++) {
    dest.nodes[index] = src.nodes[dest.nodes[index]];
    dest.nodes[index].mesh = src.meshes[dest.nodes[index].mesh];
    
    // not perfect yet for every glTF, but works for now
    dest.nodes[index].mesh.primitives.forEach( primitive => {
    for (let pKey in primitive) {
      if (pKey === "attributes") {
        let attribute = primitive.attributes;
        for (let aKey in attribute) {
          attribute[aKey] = src.accessors[attribute[aKey]];
          attribute[aKey].bufferView = src.bufferViews[attribute[aKey].bufferView];
        }
      } else if (pKey === "material") {
        primitive[pKey] = src.materials[primitive[pKey]];
      } else {
        primitive[pKey] = src.accessors[primitive[pKey]];
        primitive[pKey].bufferView = src.bufferViews[primitive[pKey].bufferView];
      }
    }
  });
  }
}

/**
 * 
 * @param {context}    gl         - GL context from canvas
 * @param {attribute}  attribute  - attributes to slice after
 * @param {buffer}     buffer     - buffer to slice from
 * @param {bufferType} type       - buffer type to pass on
 */
function sliceBuffer (gl, attribute, buffer, type) {
    let bufferType = gl.ARRAY_BUFFER;
    // Guard against too few arguments
    if (type) {
        bufferType = type;
    }
  let start = attribute.bufferView.byteOffset;
  let end   = start + attribute.bufferView.byteLength;
  let data  = buffer.slice(start, end);
  attribute.bufferView.glBuffer = makeBuffer(gl, data, bufferType);
}