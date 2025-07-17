/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// tslint:disable:organize-imports
// tslint:disable:ban-malformed-import-paths
// tslint:disable:no-new-decorators

import { LitElement, css, html, PropertyValueMap } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Analyser } from '@/live-audio-analyzer';

import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
// import { fs as backdropFS, vs as backdropVS } from './live-audio-backdrop-shader'; // No longer needed
import { vs as sphereVS } from '@/live-audio-sphere-shader';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRM, VRMExpressionPresetName, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

/**
 * 3D live audio visual.
 */
@customElement('gdm-live-audio-visuals-3d')
export class GdmLiveAudioVisuals3D extends LitElement {
  private inputAnalyser: Analyser | null = null;
  private outputAnalyser: Analyser | null = null;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  // private backdrop!: THREE.Mesh; // Removed
  private composer!: EffectComposer;
  
  private sphere: THREE.Mesh | null = null; // Fallback sphere
  private vrm: VRM | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private animationActions = new Map<string, THREE.AnimationAction>();
  private currentAction: THREE.AnimationAction | null = null;

  private clock = new THREE.Clock();
  private rotation = new THREE.Vector3(0, 0, 0);

  private originalSphereEmissive = new THREE.Color(0x000010);
  private originalSphereEmissiveIntensity = 1.5;
  private directiveTimeout: number | null = null;
  
  private blinkState = {
    isBlinking: false,
    nextBlinkTime: 0,
  };

  private baseCameraPosition = new THREE.Vector3(0, 1.6, 2);
  private focusCameraPosition = new THREE.Vector3(0, 1.55, 1.7);
  private targetCameraPosition = new THREE.Vector3().copy(this.baseCameraPosition);
  
  @property({ state: true })
  private initializationError: string | null = null;
  private isInitialized = false;
  private isComponentConnected = false;

  @property({ type: Object })
  outputNode: AudioNode | null = null;

  @property({ type: Object })
  inputNode: AudioNode | null = null;

  @property({ type: String })
  currentAvatarExpression?: string;

  @property({ type: String })
  currentAvatarGesture?: string;

  @property({ type: Boolean, attribute: 'is-ai-responding' })
  isAiResponding = false;

  private canvas: HTMLCanvasElement | null = null;
  private animationFrameId: number | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 0; 
      overflow: hidden;
    }
    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
      image-rendering: auto;
    }
    .error-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: #1a1a1a;
      color: #ffcccc;
      padding: 20px;
      box-sizing: border-box;
      text-align: center;
      font-family: sans-serif;
      direction: rtl;
    }
    .error-container p {
      margin: 5px 0;
    }
    .error-message {
      font-family: monospace;
      font-size: 0.9em;
      background-color: #333;
      padding: 10px;
      border-radius: 4px;
      max-width: 80%;
      word-wrap: break-word;
      color: #ff8a8a;
      direction: ltr;
    }
  `;
  
  constructor() {
    super();
    console.log('[gdm-live-audio-visuals-3d] Constructor');
  }

  connectedCallback() {
    super.connectedCallback();
    this.isComponentConnected = true;
    console.log('[gdm-live-audio-visuals-3d] Connected');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.isComponentConnected = false;
    console.log('[gdm-live-audio-visuals-3d] Disconnected');
    this.stopAnimationLoop();
    window.removeEventListener('resize', this.handleResize);
    this.disposeThreeObjects();
    this.inputAnalyser?.disconnect();
    this.inputAnalyser = null;
    this.outputAnalyser?.disconnect();
    this.outputAnalyser = null;
    if (this.directiveTimeout) clearTimeout(this.directiveTimeout);
  }
  
  protected firstUpdated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.firstUpdated(changedProperties);
    this.initThree();
    window.addEventListener('resize', this.handleResize);
  }

  protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('inputNode')) {
        if (this.inputNode) {
            if (!this.inputAnalyser) {
                this.inputAnalyser = new Analyser(this.inputNode);
            } else {
                this.inputAnalyser.updateNode(this.inputNode);
            }
        } else {
            this.inputAnalyser?.disconnect();
            this.inputAnalyser = null;
        }
    }
    if (changedProperties.has('outputNode')) {
        if (this.outputNode) {
            if (!this.outputAnalyser) {
                this.outputAnalyser = new Analyser(this.outputNode);
            } else {
                this.outputAnalyser.updateNode(this.outputNode);
            }
        } else {
            this.outputAnalyser?.disconnect();
            this.outputAnalyser = null;
        }
    }
    if (changedProperties.has('currentAvatarExpression') && this.currentAvatarExpression) {
        this.handleExpressionVisual(this.currentAvatarExpression);
    }
    if (changedProperties.has('currentAvatarGesture') && this.currentAvatarGesture) {
        this.handleGestureVisual(this.currentAvatarGesture);
    }
  }

  private handleExpressionVisual(expression: string) {
    if (this.vrm && this.vrm.expressionManager) {
      if (this.directiveTimeout) clearTimeout(this.directiveTimeout);
      
      // Reset all expressions to 0
      for (const expressionName of this.vrm.expressionManager.expressionMap.keys()) {
        this.vrm.expressionManager.setValue(expressionName, 0.0);
      }

      let vrmExpressionName: VRMExpressionPresetName | null = null;
      switch (expression.toLowerCase()) {
        case 'happy': vrmExpressionName = VRMExpressionPresetName.Happy; break;
        case 'angry': vrmExpressionName = VRMExpressionPresetName.Angry; break;
        case 'sad': vrmExpressionName = VRMExpressionPresetName.Sad; break;
        case 'surprised': vrmExpressionName = 'surprised' as VRMExpressionPresetName; break; // Custom if not in preset
        case 'neutral': vrmExpressionName = VRMExpressionPresetName.Neutral; break;
        default: vrmExpressionName = VRMExpressionPresetName.Neutral;
      }

      if (vrmExpressionName) {
        this.vrm.expressionManager.setValue(vrmExpressionName, 1.0);
      }
      
      if (vrmExpressionName !== VRMExpressionPresetName.Neutral) {
        this.directiveTimeout = window.setTimeout(() => {
          if (this.vrm?.expressionManager) {
            this.vrm.expressionManager.setValue(vrmExpressionName!, 0.0);
            this.vrm.expressionManager.setValue(VRMExpressionPresetName.Neutral, 1.0);
          }
          this.directiveTimeout = null;
        }, 1500); 
      }
      return;
    }

    // Fallback to sphere
    if (this.sphere && this.sphere.material instanceof THREE.MeshStandardMaterial) {
      if (this.directiveTimeout) clearTimeout(this.directiveTimeout);
      let newEmissive = this.originalSphereEmissive.getHex();
      let newIntensity = this.originalSphereEmissiveIntensity;
      switch (expression.toLowerCase()) {
        case 'angry': newEmissive = 0xff0000; newIntensity *= 1.7; break;
        case 'happy': newEmissive = 0x00ff00; newIntensity *= 1.5; break;
        case 'surprised': newEmissive = 0xffff00; newIntensity *= 2.0; break;
        case 'sad': newEmissive = 0x0000ff; newIntensity *= 1.3; break;
        default:
          this.sphere.material.emissive.setHex(this.originalSphereEmissive.getHex());
          this.sphere.material.emissiveIntensity = this.originalSphereEmissiveIntensity;
          return;
      }
      this.sphere.material.emissive.setHex(newEmissive);
      this.sphere.material.emissiveIntensity = newIntensity;
      this.directiveTimeout = window.setTimeout(() => {
        if (this.sphere && this.sphere.material instanceof THREE.MeshStandardMaterial) {
          this.sphere.material.emissive.setHex(this.originalSphereEmissive.getHex());
          this.sphere.material.emissiveIntensity = this.originalSphereEmissiveIntensity;
        }
        this.directiveTimeout = null;
      }, 700);
    }
  }

  private pointAtObject(objectName: string) {
    if (!this.vrm || !this.scene) return;

    const targetObject = this.scene.getObjectByName(objectName);
    if (!targetObject) return;

    const rightHand = this.vrm.humanoid.getBoneNode(THREE.VRMHumanoidBoneName.RightHand);
    if (rightHand) {
        // This is a simplified "point at". A real implementation would use IK.
        rightHand.lookAt(targetObject.position);
    }
  }

  private handleGestureVisual(gesture: string) {
    if (gesture.startsWith('point_at_')) {
        const objectName = gesture.substring('point_at_'.length);
        this.pointAtObject(objectName);
        return;
    }

    if (this.vrm && this.mixer && this.animationActions.size > 0) {
      const gestureName = gesture.toLowerCase();
      const action = this.animationActions.get(gestureName);
      
      if (action && this.currentAction !== action) {
        const idleAction = this.animationActions.get('idle') || this.animationActions.values().next().value;
        if (action !== idleAction) { // Don't play idle as a one-shot
            action.reset();
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.play();
            if (this.currentAction) {
                this.currentAction.crossFadeTo(action, 0.3, true);
            }
            this.currentAction = action;
        }
      }
      return;
    }

    // Fallback to sphere
    if (this.sphere) {
       if (this.directiveTimeout) clearTimeout(this.directiveTimeout);
       const originalScale = this.sphere.scale.x;
       switch (gesture.toLowerCase()) {
         case 'nod': case 'shrug': case 'wave_dismiss': case 'facepalm':
           this.sphere.scale.setScalar(originalScale * 1.08); break;
         case 'shake_head':
           this.sphere.scale.setScalar(originalScale * 0.95); break;
         default: return;
       }
       this.directiveTimeout = window.setTimeout(() => {
         if (this.sphere) { this.sphere.scale.setScalar(originalScale); }
         this.directiveTimeout = null;
       }, 300);
    }
  }

  private handleResize = () => {
    if (!this.isInitialized || !this.camera || !this.renderer || !this.composer || !this.canvas) return;
    const { width, height } = this.canvas.getBoundingClientRect();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    // No longer need to update backdrop shader uniforms
  }

  private updateBlinking(time: number) {
      if (!this.vrm?.expressionManager) return;
      
      const blinkExpression = this.vrm.expressionManager.getExpression(VRMExpressionPresetName.Blink);
      if (!blinkExpression) return;

      if (time > this.blinkState.nextBlinkTime) {
        this.vrm.expressionManager.setValue(VRMExpressionPresetName.Blink, 1.0);
        this.blinkState.nextBlinkTime = time + 0.1; 
        this.blinkState.isBlinking = true;
      } else if (this.blinkState.isBlinking) {
        this.vrm.expressionManager.setValue(VRMExpressionPresetName.Blink, 0.0);
        this.blinkState.isBlinking = false;
        this.blinkState.nextBlinkTime = time + 1.0 + Math.random() * 6.0;
      }
  }

  private updateBlinking(time: number) {
      if (!this.vrm?.expressionManager) return;

      const blinkExpression = this.vrm.expressionManager.getExpression(VRMExpressionPresetName.Blink);
      if (!blinkExpression) return;

      if (time > this.blinkState.nextBlinkTime) {
        this.vrm.expressionManager.setValue(VRMExpressionPresetName.Blink, 1.0);
        this.blinkState.nextBlinkTime = time + 0.1;
        this.blinkState.isBlinking = true;
      } else if (this.blinkState.isBlinking) {
        this.vrm.expressionManager.setValue(VRMExpressionPresetName.Blink, 0.0);
        this.blinkState.isBlinking = false;
        this.blinkState.nextBlinkTime = time + 1.0 + Math.random() * 6.0;
      }
  }

  private updateLipSync() {
    if (!this.outputAnalyser?.data || !this.vrm?.expressionManager) return;
    
    const data = this.outputAnalyser.data;
    
    // Simple frequency-to-viseme mapping
    const lowFreq = (data[0] + data[1]) / 2 / 255; 
    const midFreq = (data[2] + data[3] + data[4]) / 3 / 255;
    const highFreq = (data[5] + data[6]) / 2 / 255;

    const lerpFactor = 0.5; // Smoothing factor to avoid jerky motion

    const smoothSet = (name: VRMExpressionPresetName, targetValue: number) => {
        const current = this.vrm!.expressionManager.getValue(name) ?? 0;
        this.vrm!.expressionManager.setValue(name, current + (targetValue - current) * lerpFactor);
    };

    smoothSet(VRMExpressionPresetName.Aa, midFreq * 1.5);
    smoothSet(VRMExpressionPresetName.Ih, highFreq * 1.2);
    smoothSet(VRMExpressionPresetName.Ou, lowFreq * 0.8);
    smoothSet(VRMExpressionPresetName.Ee, midFreq * 0.7);
    smoothSet(VRMExpressionPresetName.Oh, lowFreq * 1.2);
  }

  private onAnimationFinished = (e: any) => {
    if (!this.isComponentConnected) return;
    const finishedAction = e.action;
    const idleAction = this.animationActions.get('idle') || this.animationActions.values().next().value;

    if (idleAction && finishedAction !== idleAction) {
        // Fade back to idle
        idleAction.reset();
        idleAction.play();
        if (this.currentAction) {
            idleAction.crossFadeFrom(this.currentAction, 0.5, true);
        }
        this.currentAction = idleAction;
    }
  };

  private _animationLoop = (time: number) => {
    if (!this.isInitialized || this.initializationError || !this.isComponentConnected) return;

    this.animationFrameId = requestAnimationFrame(this._animationLoop);
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // --- Dynamic Camera Logic ---
    if (this.camera) {
        // Determine target position based on isAiResponding
        const desiredTarget = this.isAiResponding ? this.focusCameraPosition : this.baseCameraPosition;

        // Add idle drift
        const driftX = Math.sin(elapsedTime * 0.1) * 0.05;
        const driftY = Math.cos(elapsedTime * 0.12) * 0.03;

        this.targetCameraPosition.x = desiredTarget.x + driftX;
        this.targetCameraPosition.y = desiredTarget.y + driftY;
        this.targetCameraPosition.z = desiredTarget.z; // Keep z separate from drift for dolly effect

        // Smoothly interpolate camera position
        this.camera.position.lerp(this.targetCameraPosition, deltaTime * 1.0); // Adjust lerp factor for speed
    }

    this.inputAnalyser?.update();
    this.outputAnalyser?.update();

    if (this.vrm) {
      this.updateLipSync();
      this.updateBlinking(time / 1000);
      this.mixer?.update(deltaTime);
      this.vrm.update(deltaTime);
    } else if (this.sphere) {
      const sphereMaterial = this.sphere.material as THREE.MeshStandardMaterial;
      if (sphereMaterial.userData.uniforms) {
          const uniforms = sphereMaterial.userData.uniforms;
          uniforms.time.value = time * 0.001;
          if (uniforms.inputData && this.inputAnalyser) {
            uniforms.inputData.value.set(
              (this.inputAnalyser.data[0] || 0) / 255, (this.inputAnalyser.data[1] || 0) / 255,
              (this.inputAnalyser.data[2] || 0) / 255, (this.inputAnalyser.data[3] || 0) / 255
            );
          }
          if (uniforms.outputData && this.outputAnalyser) {
            uniforms.outputData.value.set(
              (this.outputAnalyser.data[0] || 0) / 255, (this.outputAnalyser.data[1] || 0) / 255,
              (this.outputAnalyser.data[2] || 0) / 255, (this.outputAnalyser.data[3] || 0) / 255
            );
          }
      }
      this.rotation.x += 0.001 + ((this.inputAnalyser?.data[0] || 0) / 255) * 0.005;
      this.rotation.y += 0.002 + ((this.outputAnalyser?.data[0] || 0) / 255) * 0.005;
      this.sphere.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
    }

    this.composer.render();
  }

  private startAnimationLoop = () => {
    if (this.animationFrameId === null) {
        this._animationLoop(performance.now());
    }
  }

  private stopAnimationLoop = () => {
    if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }
  }

  private disposeThreeObjects = () => {
    if (this.scene) {
        this.scene.traverse(object => {
            if (object instanceof THREE.Mesh) {
                if (object.geometry) object.geometry.dispose();
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else if (object.material) {
                    (object.material as THREE.Material).dispose();
                }
            }
        });
        while(this.scene.children.length > 0){ this.scene.remove(this.scene.children[0]); }
    }
    if (this.renderer) this.renderer.dispose();
    if (this.mixer) {
        this.mixer.removeEventListener('finished', this.onAnimationFinished);
        this.mixer.stopAllAction();
    }
    this.mixer = null;
    this.animationActions.clear();
    this.currentAction = null;
    if (this.vrm) VRMUtils.deepDispose(this.vrm.scene);
  }

  private createFallbackSphere() {
    const sphereGeometry = new THREE.SphereGeometry(1, 64, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      roughness: 0, metalness: 1, color: 0x909090,
      emissive: this.originalSphereEmissive,
      emissiveIntensity: this.originalSphereEmissiveIntensity,
    });
    sphereMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.time = { value: 0 };
      shader.uniforms.inputData = { value: new THREE.Vector4() };
      shader.uniforms.outputData = { value: new THREE.Vector4() };
      shader.vertexShader = sphereVS;
      sphereMaterial.userData.uniforms = shader.uniforms;
    };
    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  }

  private createRoomEnvironment() {
    const textureLoader = new THREE.TextureLoader();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 10, 12, Math.PI / 4.5, 0.4, 1);
    spotLight.position.set(0, 4, 2);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 0.5;
    spotLight.shadow.camera.far = 10;
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);
    spotLight.target.position.set(0, 1.2, -0.6);

    const directionalLight = new THREE.DirectionalLight(0xffefd5, 1.2);
    directionalLight.position.set(-4, 3, 5); // From outside, angled down
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 15;
    directionalLight.shadow.camera.left = -5;
    directionalLight.shadow.camera.right = 5;
    directionalLight.shadow.camera.top = 5;
    directionalLight.shadow.camera.bottom = -5;
    directionalLight.shadow.bias = -0.001;
    this.scene.add(directionalLight);

    // Walls
    const wallTexture = textureLoader.load('/assets/textures/wall_plaster_diffuse.jpg');
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 1);
    const wallNormalTexture = textureLoader.load('/assets/textures/wall_plaster_normal.jpg');
    wallNormalTexture.wrapS = wallNormalTexture.wrapT = THREE.RepeatWrapping;
    wallNormalTexture.repeat.set(2, 1);
    const roomGeometry = new THREE.BoxGeometry(10, 6, 10);
    const roomMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        normalMap: wallNormalTexture,
        side: THREE.BackSide,
    });
    const room = new THREE.Mesh(roomGeometry, roomMaterial);
    room.position.y = 3;
    room.receiveShadow = true;
    this.scene.add(room);
    
    // Window and Exterior
    const windowFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const frameHorzGeo = new THREE.BoxGeometry(1.5, 0.05, 0.1);
    const frameVertGeo = new THREE.BoxGeometry(0.05, 0.8, 0.1);
    const windowTop = new THREE.Mesh(frameHorzGeo, windowFrameMaterial);
    windowTop.position.set(0, 2.2, -4.95);
    this.scene.add(windowTop);
    const windowBottom = new THREE.Mesh(frameHorzGeo, windowFrameMaterial);
    windowBottom.position.set(0, 1.4, -4.95);
    this.scene.add(windowBottom);
    const windowLeft = new THREE.Mesh(frameVertGeo, windowFrameMaterial);
    windowLeft.position.set(-0.725, 1.8, -4.95);
    this.scene.add(windowLeft);
    const windowRight = new THREE.Mesh(frameVertGeo, windowFrameMaterial);
    windowRight.position.set(0.725, 1.8, -4.95);
    this.scene.add(windowRight);

    const exteriorTexture = textureLoader.load('/assets/textures/outside_view.jpg');
    const exteriorMaterial = new THREE.MeshBasicMaterial({ map: exteriorTexture, fog: false });
    const exteriorPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), exteriorMaterial);
    exteriorPlane.position.set(0, 3, -5.1);
    this.scene.add(exteriorPlane);
    
    // Floor
    const woodColorTexture = textureLoader.load('/assets/textures/wood_floor_diffuse.jpg');
    woodColorTexture.wrapS = woodColorTexture.wrapT = THREE.RepeatWrapping;
    woodColorTexture.repeat.set(5, 5);
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({ map: woodColorTexture, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // Table
    const tableTexture = textureLoader.load('/assets/textures/table_wood_diffuse.jpg');
    const tableRoughnessTexture = textureLoader.load('/assets/textures/table_wood_roughness.jpg');
    const tableMaterial = new THREE.MeshStandardMaterial({ map: tableTexture, roughnessMap: tableRoughnessTexture });
    const tableTopGeo = new THREE.BoxGeometry(2, 0.1, 1);
    const tableTop = new THREE.Mesh(tableTopGeo, tableMaterial);
    tableTop.position.set(0, 1.0, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.scene.add(tableTop);

    const legGeo = new THREE.BoxGeometry(0.1, 1.0, 0.1);
    const legPositions = [ {x: 0.9, z: 0.4}, {x: -0.9, z: 0.4}, {x: 0.9, z: -0.4}, {x: -0.9, z: -0.4} ];
    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, tableMaterial);
        leg.position.set(pos.x, 0.5, pos.z);
        leg.castShadow = true;
        this.scene.add(leg);
    });

    // Props
    const mugMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const mugGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 32);
    const mug = new THREE.Mesh(mugGeo, mugMaterial);
    mug.position.set(-0.6, 1.1, 0.2);
    mug.castShadow = true;
    this.scene.add(mug);
    
    const folderMaterial = new THREE.MeshStandardMaterial({ color: 0xffe699 });
    const folderGeo = new THREE.BoxGeometry(0.22, 0.02, 0.3);
    const folder = new THREE.Mesh(folderGeo, folderMaterial);
    folder.position.set(0.5, 1.06, 0.1);
    folder.rotation.y = 0.2;
    folder.castShadow = true;
    this.scene.add(folder);

    const keyMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, roughness: 0.2 });
    const keyGeo = new THREE.BoxGeometry(0.02, 0.1, 0.01);
    const key = new THREE.Mesh(keyGeo, keyMaterial);
    key.name = "key"; // Add a name to make it findable
    key.position.set(-0.2, 1.05, -0.3);
    key.castShadow = true;
    this.scene.add(key);
  }

  private initThree() {
    this.canvas = this.renderRoot.querySelector('canvas') ?? null;
    if (!this.canvas) {
        this.initializationError = "רכיב ה-Canvas לא נמצא. לא ניתן לאתחל סצנה תלת-ממדית.";
        console.error(this.initializationError);
        return;
    }

    try {
        const { width, height } = this.canvas.getBoundingClientRect();
        this.blinkState.nextBlinkTime = this.clock.getElapsedTime() + 1.0 + Math.random() * 6.0;

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        this.camera.position.copy(this.baseCameraPosition);

        this.createRoomEnvironment();

        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();
        new EXRLoader().load('/assets/images/pizigani_1k.exr',
          (texture) => {
            if (!this.isComponentConnected) return; // Race condition guard
            if (this.scene) {
              this.scene.environment = pmremGenerator.fromEquirectangular(texture).texture;
            }
            texture.dispose();
            pmremGenerator.dispose();
          },
          undefined,
          (error) => {
            console.warn("Could not load environment map. Reflections will be basic.", error);
          }
        );

        const loader = new GLTFLoader();
        loader.register(parser => new VRMLoaderPlugin(parser));
        loader.load(
          '/assets/vrm/avatar.vrm',
          (gltf) => { // ASYNC SUCCESS
            if (!this.isComponentConnected) {
                console.warn('[gdm-live-audio-visuals-3d] VRM loaded but component is disconnected. Aborting setup.');
                VRMUtils.deepDispose(gltf.scene); // Clean up memory
                return;
            }
            try {
                const vrm = gltf.userData.vrm as VRM;
                this.vrm = vrm;
                vrm.scene.position.set(0, 0, -0.6);
                vrm.scene.traverse((obj) => {
                    if (obj instanceof THREE.Mesh) {
                        obj.castShadow = true;
                        obj.receiveShadow = true;
                    }
                });
                this.scene.add(vrm.scene);
                VRMUtils.rotateVRM0(vrm);
                this.camera.lookAt(0, 1.4, 0); 
                vrm.lookAt.target = this.camera;

                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(vrm.scene);
                    this.mixer.addEventListener('finished', this.onAnimationFinished);
                    gltf.animations.forEach((clip) => {
                        const actionName = clip.name.toLowerCase();
                        this.animationActions.set(actionName, this.mixer!.clipAction(clip));
                    });
                    const idleAction = this.animationActions.get('idle') || this.animationActions.values().next().value;
                    if (idleAction) {
                        this.currentAction = idleAction;
                        this.currentAction.play();
                    }
                }
                
                this.composer = new EffectComposer(this.renderer);
                this.composer.addPass(new RenderPass(this.scene, this.camera));
                const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
                bloomPass.threshold = 0.3;
                bloomPass.strength = 0.8;
                bloomPass.radius = 0.7;
                this.composer.addPass(bloomPass);

                this.isInitialized = true;
                this.startAnimationLoop();
            } catch (setupError) {
                console.error('[gdm-live-audio-visuals-3d] Error during successful VRM load callback:', setupError);
                this.initializationError = `שגיאה באתחול האווטאר לאחר טעינה: ${(setupError as Error).message}`;
            }
          },
          (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),
          (error) => { // ASYNC FAILURE
            console.error('[gdm-live-audio-visuals-3d] CRITICAL: VRM loading failed.', error);
            this.initializationError = `טעינת מודל האווטאר נכשלה. בדוק שהקובץ /assets/vrm/avatar.vrm קיים ושהקונסול אינו מציג שגיאות רשת (404).`;
          }
        );
    } catch(syncError) {
        console.error('[gdm-live-audio-visuals-3d] CRITICAL: Synchronous initialization failed.', syncError);
        this.initializationError = `שגיאה סינכרונית באתחול הרכיב הגרפי: ${(syncError as Error).message}`;
    }
  }

  render() {
    if (this.initializationError) {
        return html`
            <div class="error-container">
                <p style="font-size: 1.2em; color: #ff8a8a;">שגיאה בטעינת הרכיב הגרפי</p>
                <p class="error-message">${this.initializationError}</p>
                <p style="font-size: 0.9em; color: #ccc;">האפליקציה תמשיך לפעול ללא האווטאר.</p>
            </div>
        `;
    }
    return html`<canvas></canvas>`;
  }
}