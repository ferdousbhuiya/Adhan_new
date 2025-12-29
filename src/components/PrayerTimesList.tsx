import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

type Props = {
  items: { label: string; date: Date }[];
};

export default function PrayerTimesList({ items }: Props) {
  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.label}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.time}>{item.date.toLocaleTimeString()}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { padding: 12, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 16 },
  time: { fontSize: 16, fontWeight: '600' },
});
