// =====================================================================
// src/components/TabSelector.jsx
// ---------------------------------------------------------------------
// Selector de pestañas horizontal reutilizable. Muestra una lista de
// tabs scrollables con indicator animado debajo del tab activo.
// =====================================================================

import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

export default function TabSelector({ tabs, activeTab, onTabChange }) {
  const scrollRef = useRef(null);

  // Auto-scroll al tab activo cuando cambia
  useEffect(() => {
    if (!scrollRef.current || !tabs || tabs.length === 0) return;
    const activeIndex = tabs.findIndex((t) => t.id === activeTab);
    if (activeIndex < 0) return;

    // Estimar ancho de cada tab (~80px por tab + gaps)
    const estimatedOffset = activeIndex * 85;
    scrollRef.current.scrollTo({ x: Math.max(0, estimatedOffset - 40), animated: true });
  }, [activeTab, tabs]);

  if (!tabs || tabs.length === 0) return null;

  return (
    <View className="bg-white border-b border-slate-200">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        className="py-2"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              className="px-4 py-2 mr-1 rounded-xl flex-row items-center"
              style={{
                backgroundColor: isActive ? '#EEF2FF' : 'transparent',
              }}
            >
              {Icon && (
                <Icon
                  size={14}
                  color={isActive ? '#4F46E5' : '#94A3B8'}
                  strokeWidth={2}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                className="text-xs font-semibold"
                style={{ color: isActive ? '#4F46E5' : '#64748B' }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
