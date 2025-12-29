import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { getAvailableVoices } from '../services/voices';
import * as VM from '../services/voicesManager';
import { Audio } from 'expo-av';

export default function VoicesManager({ onClose }: { onClose: () => void }) {
  const [available, setAvailable] = useState(VM.getAvailableVoices());
  const [downloaded, setDownloaded] = useState<VM.VoiceMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [remoteVoices, setRemoteVoices] = useState<VM.RemoteVoice[]>([]);
  const [fetchingRemote, setFetchingRemote] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    (async () => {
      const d = await VM.listDownloadedVoices();
      setDownloaded(d);
    })();
  }, []);

  function isDownloaded(id: string) {
    return downloaded.some((d) => d.id === id);
  }

  async function previewLocalVoice(variant: string) {
    setLoading(true);
    try {
      const path = await VM.downloadVoice(variant); // ensure local
      if (!path) throw new Error('preview failed');
      // play the file
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: path.path || path });
      soundRef.current = sound;
      await soundRef.current.playAsync();
    } catch (e) {
      Alert.alert('Preview failed', 'Could not preview voice');
    } finally {
      setLoading(false);
      const d = await VM.listDownloadedVoices();
      setDownloaded(d);
    }
  }

  async function fetchRemoteDemo() {
    setFetchingRemote(true);
    const list = await VM.fetchRemoteVoices();
    setRemoteVoices(list);
    setFetchingRemote(false);
  }

  async function previewRemoteVoice(remote: VM.RemoteVoice) {
    setLoading(true);
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: remote.previewUrl });
      soundRef.current = sound;
      await soundRef.current.playAsync();
    } catch (e) {
      Alert.alert('Preview failed', 'Could not preview remote voice');
    } finally {
      setLoading(false);
    }
  }

  async function downloadRemote(remote: VM.RemoteVoice) {
    setLoading(true);
    try {
      const meta = await VM.downloadRemoteVoice(remote);
      if (meta) {
        const d = await VM.listDownloadedVoices();
        setDownloaded(d);
        Alert.alert('Downloaded', `${remote.name} saved for offline use.`);
      } else {
        Alert.alert('Failed', 'Download failed');
      }
    } catch (e) {
      Alert.alert('Failed', 'Download failed');
    } finally {
      setLoading(false);
    }
  }

  async function removeVoice(id: string) {
    setLoading(true);
    await VM.removeDownloadedVoice(id);
    const d = await VM.listDownloadedVoices();
    setDownloaded(d);
    setLoading(false);
  }

  async function setActive(id: string) {
    await VM.setActiveVoice(id);
    Alert.alert('Active', `Active voice set to ${id}`);
  }

  return (
    <View style={styles.container}>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
        <Text style={styles.header}>Voices Manager</Text>
        <Button title="Close" onPress={onClose} />
      </View>

      <Text style={{marginTop:8,fontWeight:'700'}}>Available voices</Text>
      <FlatList
        data={available}
        keyExtractor={(i: any) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={{fontSize:16}}>{item.name}</Text>
              <Text style={{fontSize:12,color:'#666'}}>{item.variant}</Text>
            </View>
            <View style={{flexDirection:'column'}}>
              <Button title="Preview" onPress={() => previewLocalVoice(item.id)} />
              {isDownloaded(item.id) ? (
                <Button title="Remove" color="#c00" onPress={() => removeVoice(item.id)} />
              ) : (
                <Button title="Download" onPress={() => previewLocalVoice(item.id)} />
              )}
              <View style={{marginTop:6}}>
                <Button title="Set active" onPress={() => setActive(item.id)} />
              </View>
            </View>
          </View>
        )}
      />

      <View style={{marginTop:12}}>
        <Text style={{marginTop:8,fontWeight:'700'}}>Remote demo voices</Text>
        <Button title={fetchingRemote ? 'Fetching...' : 'Fetch remote demo voices'} onPress={fetchRemoteDemo} />

        {remoteVoices.map((r) => (
          <View key={r.id} style={styles.row}>
            <View>
              <Text style={{fontSize:16}}>{r.name}</Text>
              <Text style={{fontSize:12,color:'#666'}}>{r.previewUrl}</Text>
            </View>
            <View style={{flexDirection:'column'}}>
              <Button title="Preview" onPress={() => previewRemoteVoice(r)} />
              <Button title="Download" onPress={() => downloadRemote(r)} />
              <View style={{marginTop:6}}>
                <Button title="Set active" onPress={() => setActive(r.id)} />
              </View>
            </View>
          </View>
        ))}

        {loading && <ActivityIndicator />}
        <Text style={{marginTop:8,fontSize:12,color:'#666'}}>Downloads are stored locally in the app's documents directory.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: 'white', flex: 1 },
  header: { fontSize: 18, fontWeight: '700' },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});