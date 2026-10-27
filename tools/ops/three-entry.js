import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
// examples/js uslubida: global THREE, ichida THREE.GLTFLoader va boshqalar
const THREE = Object.assign({}, T, { GLTFLoader, RGBELoader, SkeletonUtils });
window.THREE = THREE;
