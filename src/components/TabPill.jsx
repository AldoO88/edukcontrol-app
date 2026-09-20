import React from 'react';
import { Pressable, Text } from 'react-native';

const TabPill = ({ active, label, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="tab"
    accessibilityState={{ selected: active }}
    className="flex-1 items-center justify-center rounded-lg py-2"
    style={{
      backgroundColor: active ? '#FFFFFF' : 'transparent',
      shadowColor: active ? '#0F172A' : 'transparent',
      shadowOpacity: active ? 0.06 : 0,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: active ? 2 : 0,
    }}
  >
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: active ? '#0284C7' : '#64748B',
      }}
    >
      {label}
    </Text>
  </Pressable>
);

export default TabPill;
