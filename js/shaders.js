var Shaders = {
      arcsVertexShader: [
        'uniform float scale;',
        'uniform vec3 randomColor;',
        'uniform float isCrazy;',
        'attribute vec3 color;',
        'attribute float opacity;',
        'varying vec3 vColor;',
        'varying float vOpacity;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position * scale, 1.0);',
          'vOpacity = opacity;',
          'vColor = color * (1.-isCrazy) + randomColor * isCrazy;',
        '}'
      ].join('\n'),
      arcsFragmentShader: [
        'varying float vOpacity;',
        'varying vec3 vColor;',
        'void main() {',
          'gl_FragColor = vec4(vColor, vOpacity);',
        '}'
      ].join('\n'),
      globeVertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      globeFragmentShader: [
        'uniform sampler2D mapIndex;',
        'uniform sampler2D lookup;',
        'uniform sampler2D outline;',
        'uniform float outlineLevel;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec4 mapColor = texture2D( mapIndex, vUv );',
          'float indexedColor = mapColor.x;',
          'vec2 lookupUV = vec2( indexedColor, 0. );',
          'vec4 lookupColor = texture2D( lookup, lookupUV );',
          'float mask = lookupColor.x + (1.-outlineLevel) * indexedColor;',
          'mask = clamp(mask,0.,1.);',
          'float outlineColor = texture2D( outline, vUv ).x * outlineLevel;',
          'float diffuse = mask + outlineColor;',
          // If not testing for which country was picked, display true color, else display indexed color
          'gl_FragColor = vec4( vec3(diffuse), 1.  ) * (1.-outlineLevel) + texture2D( outline, vUv ) * outlineLevel;',
        '}'
      ].join('\n')
  };