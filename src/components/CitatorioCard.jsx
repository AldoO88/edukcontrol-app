import React from 'react';
import { View, Text } from 'react-native';
import { ChevronRight, Calendar, MapPin } from 'lucide-react-native';
import { TYPE_STYLES, STATUS_STYLES, formatDate, formatTime12 } from '@/src/utils/citationHelpers';

const CitatorioCard = ({ citatorio }) => {
  const typeStyle = TYPE_STYLES[citatorio.type] || {
    bg: '#F1F5F9',
    fg: '#475569',
    label: citatorio.type || '—',
  };
  const statusStyle =
    STATUS_STYLES[citatorio.status] || STATUS_STYLES.pending;
  const StatusIcon = statusStyle.Icon;

  return (
    <View
      className="bg-white rounded-2xl p-4 mx-4 mt-3 border border-slate-100"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: typeStyle.border,
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      {/* TYPE BADGE */}
      <View className="flex-row items-center justify-between">
        <View
          className="self-start px-2.5 py-1 rounded-full"
          style={{ backgroundColor: typeStyle.bg }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: typeStyle.fg,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {typeStyle.label}
          </Text>
        </View>
        <ChevronRight size={16} color="#CBD5E1" strokeWidth={2.5} />
      </View>

      {/* Nombre del alumno */}
      <Text
        className="mt-2 text-slate-900"
        style={{ fontSize: 16, fontWeight: '700' }}
        numberOfLines={1}
      >
        {citatorio.studentName}
      </Text>

      {/* Group badge: 1° A • Materia */}
      <Text
        className="mt-0.5 text-slate-500"
        style={{ fontSize: 12, fontWeight: '500' }}
        numberOfLines={1}
      >
        {citatorio.subject
          ? `${citatorio.groupName}  •  ${citatorio.subject}`
          : citatorio.groupName || ''}
      </Text>

      {/* Date & Time row */}
      <View className="flex-row items-center mt-2">
        <Calendar size={14} color="#64748B" strokeWidth={2} />
        <Text
          className="ml-1.5 text-slate-700"
          style={{ fontSize: 12, fontWeight: '600' }}
        >
          {`${formatDate(citatorio.date)}, ${formatTime12(citatorio.time)}`}
        </Text>
      </View>

      {/* Location row */}
      {citatorio.location ? (
        <View className="flex-row items-center mt-1">
          <MapPin size={14} color="#64748B" strokeWidth={2} />
          <Text
            className="ml-1.5 text-slate-700"
            style={{ fontSize: 12, fontWeight: '500' }}
            numberOfLines={1}
          >
            {citatorio.location}
          </Text>
        </View>
      ) : null}

      {/* STATUS */}
      <View className="flex-row items-center mt-3">
        <StatusIcon size={14} color={statusStyle.fg} strokeWidth={2.25} />
        <Text
          className="ml-1.5"
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: statusStyle.fg,
          }}
        >
          {statusStyle.label}
        </Text>
      </View>
    </View>
  );
};

export default CitatorioCard;
