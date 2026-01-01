import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Text as SvgText } from 'react-native-svg';

interface IslamicLogoProps {
  size?: number;
  variant?: 'simple' | 'animated' | 'full';
}

export const IslamicLogo: React.FC<IslamicLogoProps> = ({ size = 100, variant = 'simple' }) => {
  if (variant === 'simple') {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Mosque silhouette */}
          <Circle cx="50" cy="30" r="15" fill="#2d5a47" />
          <Rect x="40" y="45" width="20" height="25" fill="#1a4a3a" />
          <Rect x="35" y="35" width="5" height="15" fill="#2d5a47" />
          <Rect x="60" y="35" width="5" height="15" fill="#2d5a47" />
          <Rect x="47" y="60" width="6" height="10" fill="#0d1f17" />

          {/* Arabic text */}
          <SvgText x="50" y="85" textAnchor="middle" fontSize="12" fill="#f8f9fa" fontWeight="bold">أذان</SvgText>
        </Svg>
      </View>
    );
  }

  if (variant === 'animated') {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Animated mosque with more details */}
          <Circle cx="50" cy="25" r="12" fill="#4CAF50" opacity="0.8" />
          <Rect x="42" y="37" width="16" height="20" fill="#2E7D32" />
          <Rect x="38" y="30" width="4" height="12" fill="#4CAF50" />
          <Rect x="58" y="30" width="4" height="12" fill="#4CAF50" />
          <Rect x="47" y="50" width="6" height="8" fill="#1B5E20" />

          {/* Crescent moon */}
          <Path d="M70 20 C75 15, 80 20, 75 25 C70 30, 65 25, 70 20 Z" fill="#FFD700" />

          {/* Arabic calligraphy */}
          <SvgText x="50" y="75" textAnchor="middle" fontSize="10" fill="#f8f9fa" fontWeight="bold">الصلاة</SvgText>
          <SvgText x="50" y="88" textAnchor="middle" fontSize="8" fill="#e9ecef">Adhan Pro</SvgText>
        </Svg>
      </View>
    );
  }

  // Full variant
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {/* Background */}
        <Rect width="120" height="120" fill="#0d1f17" rx="10" />

        {/* Detailed mosque */}
        <Circle cx="60" cy="35" r="18" fill="#4CAF50" />
        <Rect x="48" y="53" width="24" height="30" fill="#2E7D32" />
        <Rect x="42" y="40" width="6" height="18" fill="#4CAF50" />
        <Rect x="72" y="40" width="6" height="18" fill="#4CAF50" />
        <Rect x="55" y="75" width="10" height="12" fill="#1B5E20" />

        {/* Minaret details */}
        <Rect x="40" y="35" width="4" height="8" fill="#66BB6A" />
        <Rect x="76" y="35" width="4" height="8" fill="#66BB6A" />

        {/* Stars */}
        <Circle cx="20" cy="20" r="2" fill="#FFD700" />
        <Circle cx="100" cy="25" r="1.5" fill="#FFD700" />
        <Circle cx="15" cy="80" r="1" fill="#FFD700" />

        {/* Arabic text */}
        <SvgText x="60" y="100" textAnchor="middle" fontSize="14" fill="#f8f9fa" fontWeight="bold">أذان</SvgText>
        <SvgText x="60" y="115" textAnchor="middle" fontSize="10" fill="#e9ecef">Adhan Pro</SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IslamicLogo;