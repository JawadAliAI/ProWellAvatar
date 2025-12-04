import { useAnimations, useGLTF, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";

import * as THREE from "three";
import { useSpeech } from "../hooks/useSpeech";
import facialExpressions from "../constants/facialExpressions";
import visemesMapping from "../constants/visemesMapping";
import morphTargets from "../constants/morphTargets";

export function Avatar(props) {
  const { nodes, materials, scene } = useGLTF("/models/avatar.glb");
  const { animations } = useGLTF("/models/animations.glb");

  useEffect(() => {
    console.log("GLTF Nodes available:", Object.keys(nodes));
    console.log("GLTF Materials available:", Object.keys(materials));
  }, [nodes, materials]);
  const { message, onMessagePlayed } = useSpeech();
  const [lipsync, setLipsync] = useState();
  const [setupMode, setSetupMode] = useState(false);

  // Customize avatar to look like a doctor
  if (nodes.Wolf3D_Head && nodes.Wolf3D_Head.morphTargetDictionary) {
    console.log("Morph Targets available:", Object.keys(nodes.Wolf3D_Head.morphTargetDictionary));
  }

  // Customize avatar to look like a doctor - COMMENTED OUT to fix "shape changed" issue
  /*
  if (materials) {
    // White doctor coat
    if (materials.Wolf3D_Outfit_Top) {
      materials.Wolf3D_Outfit_Top.color.set('#f8f9fa');
    }
    // Dark professional pants
    if (materials.Wolf3D_Outfit_Bottom) {
      materials.Wolf3D_Outfit_Bottom.color.set('#2c3e50');
    }
    // Professional shoes
    if (materials.Wolf3D_Outfit_Footwear) {
      materials.Wolf3D_Outfit_Footwear.color.set('#1a1a1a');
    }
  }
  */

  useEffect(() => {
    if (!message) {
      setAnimation("Idle");
      setLipsync(null);
      return;
    }

    console.log("🎵 New message received:", message.text);
    setAnimation("Idle");
    setFacialExpression("");
    setLipsync(message.lipsync);

    // Create and play audio
    const audioBlob = new Blob([Uint8Array.from(atob(message.audio), c => c.charCodeAt(0))], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audioElement = new Audio(audioUrl);

    audioElement.onloadeddata = () => {
      console.log(`🎵 Audio loaded, duration: ${audioElement.duration}s`);
      console.log(`👄 Lip sync cues: ${message.lipsync?.mouthCues?.length || 0}`);

      // Try to play immediately
      audioElement.play().catch(err => {
        console.error("❌ Failed to play audio (Autoplay blocked?):", err);
        setAudioBlocked(true);
        setLastError(err.message);
      });
    };

    audioElement.onplay = () => {
      console.log("▶️ Audio started playing");
    };

    audioElement.ontimeupdate = () => {
      // Occasional logging to verify audio is playing
      if (Math.random() < 0.05) {
        console.log(`⏱️ Audio time: ${audioElement.currentTime.toFixed(2)}s / ${audioElement.duration.toFixed(2)}s`);
      }
    };

    audioElement.onended = () => {
      console.log("⏹️ Audio playback ended");
      onMessagePlayed();
    };

    audioElement.onerror = (e) => {
      console.error("❌ Audio error:", e);
    };

    // Play the audio
    audioElement.play().catch(err => {
      console.error("❌ Failed to play audio:", err);
    });

    setAudio(audioElement);

    // Cleanup
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, [message, onMessagePlayed]);


  const group = useRef();
  const { actions, mixer } = useAnimations(animations, group);
  const [animation, setAnimation] = useState(animations.find((a) => a.name === "Idle") ? "Idle" : animations[0].name);
  useEffect(() => {
    // Animation disabled to prevent distortion (long neck/eyes)
    /*
    if (actions[animation]) {
      actions[animation]
        .reset()
        .fadeIn(mixer.stats.actions.inUse === 0 ? 0 : 0.5)
        .play();

      // FREEZE BODY MOVEMENT: Keep the pose but stop the animation (breathing, swaying)
      actions[animation].timeScale = 0;

      return () => {
        if (actions[animation]) {
          actions[animation].fadeOut(0.5);
        }
      };
    }
    */
  }, [animation]);

  const lerpMorphTarget = (target, value, speed = 0.1) => {
    let targetFound = false;
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (index === undefined || child.morphTargetInfluences[index] === undefined) {
          return;
        }
        targetFound = true;
        child.morphTargetInfluences[index] = THREE.MathUtils.lerp(child.morphTargetInfluences[index], value, speed);
      }
    });

    // Debug: warn if morph target not found (only in development)
    if (!targetFound && value > 0 && import.meta.env.DEV) {
      console.warn(`⚠️ Morph target not found: "${target}"`);
    }
  };

  const [blink, setBlink] = useState(false);
  const [facialExpression, setFacialExpression] = useState("");
  const [audio, setAudio] = useState();
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [lastError, setLastError] = useState("");

  const handlePlayAudio = () => {
    if (audio) {
      audio.play().then(() => {
        setAudioBlocked(false);
        setLastError("");
      }).catch(err => {
        console.error("Still failed to play audio:", err);
        setLastError(err.message);
      });
    }
  };

  useFrame(() => {
    // 1. Calculate Lip Sync Targets first
    const appliedMorphTargets = [];

    // Fallback mapping for avatars that lack specific visemes (using ARKit blendshapes)
    // We prioritize these ARKit shapes as they usually look better/open wider
    const morphTargetFallbacks = {
      viseme_PP: ["mouthClose", "mouthPucker"],           // P, B, M - lips together
      viseme_aa: ["jawOpen", "mouthOpen"],                // AA - open mouth, jaw down
      viseme_O: ["mouthFunnel", "jawOpen"],               // O - rounded lips
      viseme_U: ["mouthPucker", "mouthFunnel"],           // U - pursed lips
      viseme_I: ["mouthSmile", "jawOpen"],                // I - smile with slight opening
      viseme_TH: ["mouthOpen", "jawOpen"],                // TH - tongue between teeth
      viseme_kk: ["jawOpen", "mouthOpen"],                // K, G - back of throat
      viseme_FF: ["mouthUpperUpLeft", "mouthUpperUpRight"], // F, V - teeth on lower lip
      viseme_DD: ["jawOpen", "mouthOpen"],                // D, T - tongue at teeth
      viseme_nn: ["mouthClose", "jawOpen"],               // N - nasal sound
      viseme_RR: ["mouthOpen", "mouthFunnel"],            // R - slight pucker
      viseme_SS: ["mouthSmile", "mouthDimpleLeft", "mouthDimpleRight"], // S - teeth together, smile
      viseme_sil: ["mouthClose"],                         // Silence
      viseme_CH: ["mouthSmile", "mouthFunnel"],           // CH, J - lips forward
      viseme_E: ["mouthSmile", "jawOpen"],                // E - wide smile
    };

    if (message && lipsync && audio && !audio.paused && !audio.ended) {
      const currentAudioTime = audio.currentTime;
      for (let i = 0; i < lipsync.mouthCues.length; i++) {
        const mouthCue = lipsync.mouthCues[i];
        if (currentAudioTime >= mouthCue.start && currentAudioTime <= mouthCue.end) {
          const primaryTarget = visemesMapping[mouthCue.value];

          // Priority: Check Fallbacks (ARKit) FIRST, then Primary (Viseme)
          if (primaryTarget && morphTargetFallbacks[primaryTarget]) {
            for (const fallback of morphTargetFallbacks[primaryTarget]) {
              if (nodes.Wolf3D_Head.morphTargetDictionary && nodes.Wolf3D_Head.morphTargetDictionary[fallback] !== undefined) {
                appliedMorphTargets.push(fallback);
              }
            }
          }

          // If no fallbacks used, check primary
          if (appliedMorphTargets.length === 0 && primaryTarget && nodes.Wolf3D_Head.morphTargetDictionary && nodes.Wolf3D_Head.morphTargetDictionary[primaryTarget] !== undefined) {
            appliedMorphTargets.push(primaryTarget);
          }

          break;
        }
      }
    }

    // 2. Apply Facial Expressions (but DON'T reset active lip sync targets)
    !setupMode &&
      morphTargets.forEach((key) => {
        // Skip if this key is being driven by lip sync
        if (appliedMorphTargets.includes(key)) return;

        const mapping = facialExpressions[facialExpression];
        if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") {
          return; // eyes wink/blink are handled separately
        }
        if (mapping && mapping[key]) {
          lerpMorphTarget(key, mapping[key], 0.1);
        } else {
          lerpMorphTarget(key, 0, 0.1);
        }
      });

    lerpMorphTarget("eyeBlinkLeft", blink ? 1 : 0, 0.5);
    lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 0.5);

    if (setupMode) {
      return;
    }

    // 3. Apply Lip Sync Targets (with higher intensity)
    appliedMorphTargets.forEach(target => {
      lerpMorphTarget(target, 1, 0.8); // Increased speed/intensity
    });

    // Reset all other visemes to 0
    Object.values(visemesMapping).forEach((value) => {
      if (appliedMorphTargets.includes(value)) {
        return;
      }
      // We don't need to reset here because the facial expression loop above already resets everything not in appliedMorphTargets!
    });
  });

  useControls("FacialExpressions", {
    animation: {
      value: animation,
      options: animations.map((a) => a.name),
      onChange: (value) => setAnimation(value),
    },
    facialExpression: {
      options: Object.keys(facialExpressions),
      onChange: (value) => setFacialExpression(value),
    },
    setupMode: button(() => {
      setSetupMode(!setupMode);
    }),
    logMorphTargetValues: button(() => {
      const emotionValues = {};
      Object.values(nodes).forEach((node) => {
        if (node.morphTargetInfluences && node.morphTargetDictionary) {
          morphTargets.forEach((key) => {
            if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") {
              return;
            }
            const value = node.morphTargetInfluences[node.morphTargetDictionary[key]];
            if (value > 0.01) {
              emotionValues[key] = value;
            }
          });
        }
      });
      console.log(JSON.stringify(emotionValues, null, 2));
    }),
  });

  useControls("MorphTarget", () =>
    Object.assign(
      {},
      ...morphTargets.map((key) => {
        return {
          [key]: {
            label: key,
            value: 0,
            min: 0,
            max: 1,
            onChange: (val) => {
              lerpMorphTarget(key, val, 0.1);
            },
          },
        };
      })
    )
  );

  useEffect(() => {
    // Blinking disabled
    setBlink(false);
  }, []);

  return (
    <group {...props} dispose={null} ref={group} position={[0, -0.5, 0]}>
      {nodes.Hips && <primitive object={nodes.Hips} />}
      {nodes.EyeLeft && (
        <skinnedMesh
          name="EyeLeft"
          geometry={nodes.EyeLeft.geometry}
          material={materials.Wolf3D_Eye}
          skeleton={nodes.EyeLeft.skeleton}
          morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
          morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
        />
      )}
      {nodes.EyeRight && (
        <skinnedMesh
          name="EyeRight"
          geometry={nodes.EyeRight.geometry}
          material={materials.Wolf3D_Eye}
          skeleton={nodes.EyeRight.skeleton}
          morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
          morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
        />
      )}
      {nodes.Wolf3D_Head && (
        <skinnedMesh
          name="Wolf3D_Head"
          geometry={nodes.Wolf3D_Head.geometry}
          material={materials.Wolf3D_Skin}
          skeleton={nodes.Wolf3D_Head.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
        />
      )}
      {nodes.Wolf3D_Teeth && (
        <skinnedMesh
          name="Wolf3D_Teeth"
          geometry={nodes.Wolf3D_Teeth.geometry}
          material={materials.Wolf3D_Teeth}
          skeleton={nodes.Wolf3D_Teeth.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
        />
      )}
      {nodes.Wolf3D_Glasses && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Glasses.geometry}
          material={materials.Wolf3D_Glasses}
          skeleton={nodes.Wolf3D_Glasses.skeleton}
        />
      )}
      {nodes.Wolf3D_Headwear && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Headwear.geometry}
          material={materials.Wolf3D_Headwear}
          skeleton={nodes.Wolf3D_Headwear.skeleton}
        />
      )}
      {nodes.Wolf3D_Hair && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Hair.geometry}
          material={materials.Wolf3D_Hair}
          skeleton={nodes.Wolf3D_Hair.skeleton}
        />
      )}
      {nodes.Wolf3D_Beard && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Beard.geometry}
          material={materials.Wolf3D_Beard}
          skeleton={nodes.Wolf3D_Beard.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Beard.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Beard.morphTargetInfluences}
        />
      )}
      {nodes.Wolf3D_Body && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Body.geometry}
          material={materials.Wolf3D_Body}
          skeleton={nodes.Wolf3D_Body.skeleton}
        />
      )}
      {nodes.Wolf3D_Outfit_Bottom && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
          material={materials.Wolf3D_Outfit_Bottom}
          skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
        />
      )}
      {nodes.Wolf3D_Outfit_Footwear && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
          material={materials.Wolf3D_Outfit_Footwear}
          skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
        />
      )}
      {nodes.Wolf3D_Outfit_Top && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Top.geometry}
          material={materials.Wolf3D_Outfit_Top}
          skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
        />
      )}
      {audioBlocked && (
        <Html position={[0, 1.5, 0]} center>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handlePlayAudio}
              style={{
                background: 'rgba(255, 0, 0, 0.9)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '24px',
                border: '2px solid white',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                pointerEvents: 'auto',
                marginBottom: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
              }}
            >
              🔊 Tap to Unmute / Play
            </button>
            <div style={{ background: 'rgba(0,0,0,0.7)', color: '#ffaaaa', padding: '5px', borderRadius: '5px', fontSize: '12px' }}>
              {lastError}
            </div>
          </div>
        </Html >
      )}
    </group >
  );
}

useGLTF.preload("/models/avatar.glb");
