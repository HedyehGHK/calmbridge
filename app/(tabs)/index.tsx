// app/(tabs)/index.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Slider from "@react-native-community/slider";
import * as Speech from "expo-speech";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fillTemplate, loadScripts, ProcStep, StateTag } from "../../hooks/useHypno";

// ---------- mock "sensor" calmness state (0..100) ----------
function useCalmness() {
  const [calmness, setCalmness] = useState(40);
  return { calmness, setCalmness };
}

// ---------- simple HRV proxy from calmness ----------
function hrvFromCalmness(calmness: number) {
  const rmssd = 10 + (calmness / 100) * 70; // maps 0..100 -> ~10..80 ms
  return Math.round(rmssd);
}

// ---------- breathing coach (animated concentric circles) ----------
const BreathingCoach: React.FC<{ targetBpm?: number }> = ({ targetBpm = 6 }) => {
  const scale = useRef(new Animated.Value(0.85)).current;
  const cycleMs = useMemo(() => Math.max(4000, Math.round(60000 / targetBpm)), [targetBpm]); // ~10s for 6 bpm

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: cycleMs / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.85, duration: cycleMs / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [cycleMs]);

  return (
    <View style={styles.coachWrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Svg width={180} height={180}>
          <Circle cx="90" cy="90" r="80" fill="#e8f5e9" />
          <Circle cx="90" cy="90" r="60" fill="#c8e6c9" />
          <Circle cx="90" cy="90" r="40" fill="#a5d6a7" />
        </Svg>
      </Animated.View>
      <Text style={styles.coachText}>Inhale gently… exhale slowly…</Text>
      <Text style={styles.coachHint}>Breathe with the circle as it grows and shrinks</Text>
    </View>
  );
};

// ---------- traffic light for clinician ----------
function statusFromRMSSD(rmssd: number): "GREEN" | "YELLOW" | "RED" {
  if (rmssd >= 50) return "GREEN";
  if (rmssd >= 30) return "YELLOW";
  return "RED";
}
const TrafficLight: React.FC<{ rmssd: number }> = ({ rmssd }) => {
  const s = statusFromRMSSD(rmssd);
  return (
    <View style={styles.trafficWrap}>
      <View style={[styles.light, { backgroundColor: s === "RED" ? "#ef5350" : "#ffcdd2" }]} />
      <View style={[styles.light, { backgroundColor: s === "YELLOW" ? "#ffeb3b" : "#fff9c4" }]} />
      <View style={[styles.light, { backgroundColor: s === "GREEN" ? "#66bb6a" : "#c8e6c9" }]} />
      <Text style={styles.trafficText}>Status: {s} (RMSSD≈{rmssd} ms)</Text>
    </View>
  );
};

// ---------- small button ----------
const Btn: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.btn}>
    <Text style={styles.btnText}>{label}</Text>
  </TouchableOpacity>
);

// ---------- main screen ----------
export default function IndexScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ anchor?: string }>();
  const pickedKey = (params.anchor as string) || ""; // from /avatar?anchor=...

  const { calmness, setCalmness } = useCalmness();
  const rmssd = hrvFromCalmness(calmness);

  // load text scripts (from assets/data/scripts.en.json)
  const scripts = useMemo(() => loadScripts(), []);
  const [procStep, setProcStep] = useState<ProcStep>("IDLE"); // IDLE | DRILL | INJECTION

  // TTS controls
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [voiceRate, setVoiceRate] = useState(0.95);

  // map keys from Avatar screen to readable anchors
  const anchorMap: Record<string, string> = {
    pinwheel: "a colorful pinwheel",
    fox: "a friendly fox",
    cupcake: "a yummy cupcake",
  };

  // derive state + anchor + text
  const state: StateTag = rmssd >= 50 ? "CALM" : rmssd >= 30 ? "RECOVER" : "ALERT";
  const defaultAnchor = scripts.anchors[procStep];      // fallback per step
  const selectedAnchor = anchorMap[pickedKey];          // from /avatar
  const anchor = selectedAnchor ?? defaultAnchor;
  const text = fillTemplate(scripts.script[state], { anchor });

  // speak text whenever it changes
  useEffect(() => {
    if (!ttsEnabled) return;
    Speech.stop();
    Speech.speak(text, { language: "en-US", rate: voiceRate, pitch: 1.0 });
    return () => {
      Speech.stop();
    };
  }, [text, ttsEnabled, voiceRate]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Child section */}
      <Text style={styles.title}>CalmBridge — Child View</Text>

      <View style={[styles.row, { marginTop: 6 }]}>
        <Btn label="Choose Anchor" onPress={() => router.push("/avatar")} />
      </View>

      <BreathingCoach targetBpm={6} />
      <View style={styles.scriptBox}>
        <Text style={styles.scriptText}>{text}</Text>
      </View>

      {/* Clinician section */}
      <Text style={[styles.title, { marginTop: 8 }]}>Clinician</Text>
      <TrafficLight rmssd={rmssd} />
      <View style={styles.row}>
        <Btn label="Start Drill" onPress={() => setProcStep("DRILL")} />
        <Btn label="Start Injection" onPress={() => setProcStep("INJECTION")} />
        <Btn label="Reset" onPress={() => setProcStep("IDLE")} />
      </View>

      {/* TTS controls */}
      <View style={[styles.row, { marginTop: 8 }]}>
        <Btn label={ttsEnabled ? "Mute Voice" : "Enable Voice"} onPress={() => setTtsEnabled(v => !v)} />
        <Btn label="Slower" onPress={() => setVoiceRate(r => Math.max(0.6, r - 0.1))} />
        <Btn label="Faster" onPress={() => setVoiceRate(r => Math.min(1.3, r + 0.1))} />
      </View>

      {/* Sensor simulator (to be replaced by BLE later) */}
      <View style={styles.sliderWrap}>
        <Text style={styles.sliderLabel}>Calmness (sensor simulator): {calmness}</Text>
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={0}
          maximumValue={100}
          value={calmness}
          onValueChange={(v) => setCalmness(Math.round(v as number))}
          minimumTrackTintColor="#66bb6a"
          maximumTrackTintColor="#ddd"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#1b5e20" },
  coachWrap: { alignItems: "center", marginTop: 8 },
  coachText: { marginTop: 8, fontSize: 16, fontWeight: "600", color: "#2e7d32" },
  coachHint: { marginTop: 4, fontSize: 13, color: "#4caf50" },
  scriptBox: { marginTop: 12, padding: 12, backgroundColor: "#f1f8e9", borderRadius: 12 },
  scriptText: { fontSize: 16, lineHeight: 24, color: "#2e7d32", textAlign: "left" },
  trafficWrap: { marginTop: 8, alignItems: "center" },
  trafficText: { marginTop: 6, color: "#2e7d32", fontWeight: "600" },
  light: { width: 20, height: 20, borderRadius: 10, marginVertical: 3 },
  row: { flexDirection: "row", gap: 8, marginTop: 6, justifyContent: "center" },
  btn: { backgroundColor: "#81c784", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  btnText: { color: "#0a3d12", fontWeight: "700" },
  sliderWrap: { marginTop: 12 },
  sliderLabel: { marginBottom: 4, color: "#2e7d32" }
});
