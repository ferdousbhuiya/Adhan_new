import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCHEDULED_IDS_KEY = 'SCHEDULED_ADHAN_IDS';

export async function ensureNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('adhan-channel', {
      name: 'Adhan',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted' || status === 'provisional';
}

export async function scheduleNotificationForPrayer(
  idTag: string,
  title: string,
  body: string,
  date: Date,
  voicePath?: string
) {
  const trigger = { date } as any;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: { idTag, voicePath },
    },
    trigger,
  });

  // persist scheduled id
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    arr.push(id);
    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(arr));
  } catch (e) {
    // ignore persistence errors
  }

  return id;
}

export async function cancelAllScheduledNotifications() {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    await Promise.all(arr.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    await AsyncStorage.removeItem(SCHEDULED_IDS_KEY);
  } catch (e) {
    // ignore
  }
}

export async function scheduleDailyPrayerNotifications(prayerTimesMap: { [k: string]: Date }, voicePath?: string) {
  await cancelAllScheduledNotifications();
  await ensureNotificationChannel();

  const entries = Object.entries(prayerTimesMap);

  const scheduled = [] as string[];

  for (const [name, dt] of entries) {
    // If time is in the past for today, schedule for tomorrow
    const now = new Date();
    let scheduledDate = new Date(dt);
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const id = await scheduleNotificationForPrayer(
      `${name}-${scheduledDate.toISOString().slice(0, 10)}`,
      `${name} prayer time`,
      `It's time for ${name} prayer`,
      scheduledDate,
      voicePath
    );
    scheduled.push(id);
  }

  return scheduled;
}

export async function scheduleTestNotification(minutesFromNow = 1, voicePath?: string) {
  await ensureNotificationChannel();
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesFromNow);
  const id = await scheduleNotificationForPrayer(
    `test-${date.toISOString()}`,
    'Test Adhan',
    'This notification will play the active adhan voice when received.',
    date,
    voicePath
  );

  // return the scheduled id and date for UI
  return { id, date };
}

export async function presentTestNotification(voicePath?: string) {
  await ensureNotificationChannel();
  try {
    const id = await Notifications.presentNotificationAsync({
      title: 'Test Adhan',
      body: 'This notification will play the active adhan voice when received.',
      data: { voicePath },
    });
    return id;
  } catch (e) {
    console.warn('presentTestNotification failed', e);
    throw e;
  }
} 
