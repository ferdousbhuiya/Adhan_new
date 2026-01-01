import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from 'react-native';
import * as Location from 'expo-location';
import Svg, { Circle, Line, Text as SvgText, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.8;

interface QiblaCompassProps {
  onClose?: () => void;
}

const QiblaCompass: React.FC<QiblaCompassProps> = ({ onClose }) => {
  const [heading, setHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeCompass();
  }, []);

  const initializeCompass = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for Qibla direction.');
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Calculate Qibla direction (simplified - Mecca is at 21.4225° N, 39.8262° E)
      const meccaLat = 21.4225;
      const meccaLng = 39.8262;
      const userLat = currentLocation.coords.latitude;
      const userLng = currentLocation.coords.longitude;

      const qiblaAngle = calculateQiblaDirection(userLat, userLng, meccaLat, meccaLng);
      setQiblaDirection(qiblaAngle);

      // Start compass
      const subscription = await Location.watchHeadingAsync((headingData) => {
        setHeading(headingData.trueHeading || headingData.magHeading || 0);
      });

      setLoading(false);

      return () => subscription.remove();
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize compass');
      setLoading(false);
    }
  };

  const calculateQiblaDirection = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  const getDirectionDifference = () => {
    let diff = qiblaDirection - heading;
    if (diff < 0) diff += 360;
    return diff;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Initializing Qibla Compass...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Qibla Compass</Text>
        <Text style={styles.subtitle}>Face towards the Kaaba</Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.compassContainer}>
        <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox="0 0 300 300">
          {/* Outer circle */}
          <Circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            stroke="#2d5a47"
            strokeWidth="3"
          />

          {/* Inner circle */}
          <Circle
            cx="150"
            cy="150"
            r="120"
            fill="#0d1f17"
            stroke="#4CAF50"
            strokeWidth="2"
          />

          {/* Direction markers */}
          {['N', 'E', 'S', 'W'].map((dir, index) => {
            const angle = index * 90;
            const radian = (angle - 90) * Math.PI / 180;
            const x = 150 + Math.cos(radian) * 110;
            const y = 150 + Math.sin(radian) * 110;

            return (
              <SvgText
                key={dir}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize="16"
                fill="#f8f9fa"
                fontWeight="bold"
              >
                {dir}
              </SvgText>
            );
          })}

          {/* Degree markers */}
          {Array.from({ length: 36 }, (_, i) => {
            const angle = i * 10;
            const radian = (angle - 90) * Math.PI / 180;
            const innerX = 150 + Math.cos(radian) * 100;
            const innerY = 150 + Math.sin(radian) * 100;
            const outerX = 150 + Math.cos(radian) * 120;
            const outerY = 150 + Math.sin(radian) * 120;

            return (
              <Line
                key={i}
                x1={innerX}
                y1={innerY}
                x2={outerX}
                y2={outerY}
                stroke="#666"
                strokeWidth={i % 9 === 0 ? "2" : "1"}
              />
            );
          })}

          {/* Compass needle (points to magnetic north) */}
          <Line
            x1="150"
            y1="150"
            x2="150"
            y2="50"
            stroke="#FF4444"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Qibla arrow (green, points to Qibla) */}
          <Path
            d={`M 150 150 L ${150 + Math.sin((qiblaDirection * Math.PI) / 180) * 80} ${150 - Math.cos((qiblaDirection * Math.PI) / 180) * 80}`}
            stroke="#4CAF50"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Qibla indicator at the end */}
          <Circle
            cx={150 + Math.sin((qiblaDirection * Math.PI) / 180) * 80}
            cy={150 - Math.cos((qiblaDirection * Math.PI) / 180) * 80}
            r="8"
            fill="#4CAF50"
          />

          {/* Center point */}
          <Circle cx="150" cy="150" r="8" fill="#f8f9fa" />
          <Circle cx="150" cy="150" r="4" fill="#2d5a47" />
        </Svg>

        {/* Rotate the entire compass based on device heading */}
        <View style={[styles.compassRotation, { transform: [{ rotate: `${-heading}deg` }] }]}>
          <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox="0 0 300 300" style={styles.absolute}>
            {/* Red north indicator */}
            <Path
              d="M 150 30 L 140 50 L 160 50 Z"
              fill="#FF4444"
            />
          </Svg>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Qibla Direction: {Math.round(qiblaDirection)}°
        </Text>
        <Text style={styles.infoText}>
          Current Heading: {Math.round(heading)}°
        </Text>
        <Text style={styles.infoText}>
          Turn: {Math.round(getDirectionDifference())}° {getDirectionDifference() < 180 ? 'right' : 'left'}
        </Text>
      </View>

      <Text style={styles.instruction}>
        Rotate your device until the green arrow points to the red north indicator
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1f17',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8f9fa',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e9ecef',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2d5a47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#f8f9fa',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d1f17',
  },
  loadingText: {
    color: '#f8f9fa',
    fontSize: 16,
    marginTop: 10,
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  compassRotation: {
    position: 'absolute',
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
  },
  absolute: {
    position: 'absolute',
  },
  infoContainer: {
    backgroundColor: '#1a4a3a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    color: '#f8f9fa',
    fontSize: 16,
    marginBottom: 5,
  },
  instruction: {
    color: '#e9ecef',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default QiblaCompass;