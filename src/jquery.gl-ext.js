// Copyright (c) 2011 Kevin Rabsatt
//
// The .x object we add to the WebGLRenderContext.

/**
 * Defines some shortcuts we will add to the context.
 * @constructor
 */
function GLExtension(gl) {
  this.info = INFO;
  this._models = [];
  this._gl = gl;

  this._draw = function () {};
  this._update = function () {};

  this.frame = function () {
    this._draw(this._gl);
    this._update();
  };
}

/**
 * Create a model that uses the given material.
 *
 * @param {Material}  material  A material to use to draw the new model.
 * @return The created material.
 */
GLExtension.prototype.createModel = function(material, type, len) {
  model = new Model(this._gl, material, type, len);
  this._models.push(model);
  return model;
};

GLExtension.prototype.model = GLExtension.prototype.createModel;

/**
 * Loads a model from a json file at a given a url.
 *
 * To create json models, you can use blender along with blender-machete:
 * http://blender.org
 * http://code.google.com/p/blender-machete
 *
 * @param {Material} material  The material to use to render the model.
 * @param {String} url  The url of the file to load.
 * @param {Object} attrs  A set of model fields and their corresponding
 *                        shader attribute names.  The attribute name for
 *                        verts must be set.
 * @param {function} done  Called when the model is loaded.
 */
GLExtension.prototype.loadModel = function(material, url, attrs, done) {
  $.ajax( url, {
    dataType: "json",
    error: function (jqXHR, textStatus, errorThrown) {
       alert('Loading model from "' + url + '" failed: ' + textStatus)
    },
    success: function(result) {
      if (result.objs) {
        for (var i = 0; i < result.objs.length; ++i) {
          var obj = result.objs[i];
          if (obj.mesh) {
            var model = modelFromMesh(gl, obj.mesh, attrs);
            done(model);
          }
        }
      } else if (result.v) {
        var model = modelFromMesh(gl, result, attrs);
        done(model);
      }
    }
  });
};

modelFromMesh = function(gl, mesh, attrs) {
  var model = gl.x.createModel(material, gl.TRIANGLES, mesh.f.length);
  if (!attrs.verts) {
    alert('Missing required attribute verts in loadModel param.');
  } else {
    model.addAttribute(mesh.v, attrs.verts);
  }
  if (attrs.norms) {
    if (!mesh.n) {
      alert('Model missing norms param, but required by attrs.');
    } else {
      model.addAttribute(mesh.n, attrs.norms);
    }
  }
  model.addElementArray(mesh.f);
  return model;
}

/**
 * Creates a new material from shader script elements.
 *
 * @param {String} vsId:  The vertex shader script element id.
 * @param {String} fsId:  The fragment shader script element id.
 * @return {Material}  A new material object.
 */
GLExtension.prototype.createMaterial = function(vsId, fsId) {
  var gl = this._gl;
  this.currentMaterial = new Material(gl);
  material = this.currentMaterial;
  material.loadShader(vsId,  gl.VERTEX_SHADER);
  material.loadShader(fsId,  gl.FRAGMENT_SHADER);
  material.link();
  return material;
};

GLExtension.prototype.material = GLExtension.prototype.createMaterial;

/**
 * Initializes depth function and value.
 *
 * @param {Number} depth  Default depth (default 1.0)
 */
GLExtension.prototype.initDepth = function(depth) {
  if (!depth) {
    depth = 1.0;
  }
  var gl = this._gl;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(depth);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
}

/**
 * Gets the first model (temporary)
 */
GLExtension.prototype.models = function(selector) {
  if (typeof(selector) == 'number') {
    return this._models[selector];
  }
  // TODO Add iteration
  return this._models[0];
};

GLExtension.prototype.draw = function(optFunc) {
  if (optFunc) {
    var oldDraw = this._draw;
    this._draw = function(gl) {
      oldDraw(gl);
      optFunc(gl)
    };
  } else {
    this._draw(this._gl);
  }

  return this;
};

GLExtension.prototype.update = function(optFunc) {
  if (optFunc) {
    var oldUpdate = this._update();
    this._update = function() {
      oldDraw();
      optFunc()
    };
  } else {
    this._update();
  }

  return this;
};
