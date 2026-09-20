import React from 'react';
import { View, Text } from 'react-native';

const StatCard = ({ label, value, valueColor, bgColor }) => (
  <View
    className="flex-1 rounded-2xl p-3"
    style={{
      backgroundColor: bgColor,
    }}
  >
    <Text
      style={{
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
      }}
    >
      {label}
    </Text>
    <Text
      className="mt-1"
      style={{ fontSize: 22, fontWeight: '800', color: valueColor }}
    >
      {value}
    </Text>
  </View>
);

export default StatCard;
