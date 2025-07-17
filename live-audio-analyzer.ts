/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Analyser class for live audio visualisation.
 */
export class Analyser {
  private analyser: AnalyserNode | null = null; // Initialize to null
  private bufferLength = 0;
  private dataArray: Uint8Array;
  private nodeConnected: AudioNode | null = null; // Keep track of the connected node

  constructor(node: AudioNode) {
    if (!node || !node.context) {
        console.error("[Analyser] Invalid AudioNode or AudioContext for Analyser. Cannot initialize.");
        this.bufferLength = 0; 
        this.dataArray = new Uint8Array(0);
        // this.analyser remains null
        return;
    }
    this.analyser = node.context.createAnalyser();
    this.analyser.fftSize = 32; // Minimal FFT size for simple visualization
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    try {
        node.connect(this.analyser);
        this.nodeConnected = node;
    } catch (e) {
        console.error("[Analyser] Failed to connect node to analyser:", e);
    }
  }

  public updateNode(newNode: AudioNode) {
    if (!newNode || !newNode.context) {
      console.error("[Analyser] Invalid new AudioNode or AudioContext for updateNode.");
      return;
    }
    if (this.nodeConnected === newNode) {
        // console.log("[Analyser] New node is the same as the current one. No update needed.");
        return;
    }
    
    // Disconnect existing node if analyser and nodeConnected exist
    if (this.nodeConnected && this.analyser) {
        try {
            this.nodeConnected.disconnect(this.analyser);
        } catch (e) {
            console.warn("[Analyser] Error disconnecting old node from analyser:", e);
        }
    }

    // Handle analyser recreation or initialization
    if (this.analyser && newNode.context !== this.analyser.context) {
        console.warn("[Analyser] New node has a different AudioContext. Recreating analyser.");
        this.analyser.disconnect(); // Disconnect old analyser first
        this.analyser = newNode.context.createAnalyser();
        this.analyser.fftSize = 32;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
    } else if (!this.analyser) { // If analyser was null due to initial error or never set
        this.analyser = newNode.context.createAnalyser();
        this.analyser.fftSize = 32;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
    }
    // If this.analyser exists (either old one from same context or newly created)
    if (this.analyser) {
        try {
            newNode.connect(this.analyser);
            this.nodeConnected = newNode;
            console.log("[Analyser] Successfully connected new node to analyser.");
        } catch (e) {
            console.error("[Analyser] Failed to connect new node to analyser:", e);
            // If connection fails, perhaps set nodeConnected to null or handle error state
            this.nodeConnected = null; 
        }
    } else {
        console.error("[Analyser] Analyser is null, cannot connect new node.");
    }
  }

  update() {
    if (this.analyser) {
        this.analyser.getByteFrequencyData(this.dataArray);
    } else {
        // Fill with zeros or some default if analyser is not available
        this.dataArray.fill(0);
    }
  }

  get data() {
    return this.dataArray;
  }

  // Method to safely disconnect when the analyser instance is no longer needed
  public disconnect() {
    if (this.nodeConnected && this.analyser) {
        try {
            this.nodeConnected.disconnect(this.analyser);
        } catch(e) {
            console.warn("[Analyser] Error disconnecting node on Analyser.disconnect():", e);
        }
    }
    if (this.analyser) {
        try {
            this.analyser.disconnect();
        } catch(e) {
             console.warn("[Analyser] Error disconnecting analyser itself:", e);
        }
    }
    this.nodeConnected = null;
    // Optionally, could set this.analyser = null here too, if disconnect implies full cleanup
  }
}
