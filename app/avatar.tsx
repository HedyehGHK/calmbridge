// app/avatar.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const Option: React.FC<{ label: string; emoji: string; value: string; onPick: (v: string) => void }> = ({ label, emoji, value, onPick }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPick(value)}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function AvatarScreen() {
  const router = useRouter();

  const pick = (value: string) => {
    // برگرد به صفحهٔ اصلی تب‌ها و مقدار anchor را در URL بفرست
    router.replace({ pathname: "/(tabs)", params: { anchor: value } });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Pick your Anchor</Text>
      <Text style={styles.subtitle}>Choose something the child loves</Text>

      <View style={styles.grid}>
        <Option label="Colorful Pinwheel" emoji="🌀" value="pinwheel" onPick={pick} />
        <Option label="Friendly Fox" emoji="🦊" value="fox" onPick={pick} />
        <Option label="Yummy Cupcake" emoji="🧁" value="cupcake" onPick={pick} />
      </View>

      <Text style={styles.hint}>You can add real images later; this is a simple MVP.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: "#fff", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 6, color: "#1b5e20" },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 18, color: "#2e7d32" },
  grid: { flexDirection: "row", justifyContent: "space-around" },
  card: { alignItems: "center", padding: 16, backgroundColor: "#f1f8e9", borderRadius: 14, width: 110 },
  emoji: { fontSize: 42 },
  label: { marginTop: 8, fontWeight: "700", color: "#1b5e20", textAlign: "center" },
  hint: { marginTop: 20, textAlign: "center", color: "#4caf50" },
});
