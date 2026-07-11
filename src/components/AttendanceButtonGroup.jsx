// =====================================================================
// AttendanceButtonGroup.jsx
// ---------------------------------------------------------------------
// Grupo de 3 botones toggle (Presente / Retardo / Falta) para
// seleccionar el status de un alumno. Encapsula la lógica de
// "botón activo vs inactivo" según el status actual.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: View, Text, TouchableOpacity.
import { View, Text, TouchableOpacity } from 'react-native';

// clsx.
import { clsx } from 'clsx';

// Iconos.
import { CheckCircle2, Clock, XCircle } from 'lucide-react-native';

// Constantes.
import { ATTENDANCE_STATUS, ATTENDANCE_LABELS } from '../constants/statusUi';

// Configuración de cada botón. Mapeamos status -> { active, inactive }.
// Centralizarlo evita if-else encadenados por cada status.
const STATUS_BUTTONS = [
  {
    status: ATTENDANCE_STATUS.PRESENT,
    label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.PRESENT],
    activeBg: 'bg-emerald-500',
    inactiveBg: 'bg-emerald-50 border border-emerald-200',
    iconColor: '#059669',
    activeIconColor: '#ffffff',
    Icon: CheckCircle2,
  },
  {
    status: ATTENDANCE_STATUS.LATE,
    label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.LATE],
    activeBg: 'bg-amber-500',
    inactiveBg: 'bg-amber-50 border border-amber-200',
    iconColor: '#d97706',
    activeIconColor: '#ffffff',
    Icon: Clock,
  },
  {
    status: ATTENDANCE_STATUS.ABSENT,
    label: ATTENDANCE_LABELS[ATTENDANCE_STATUS.ABSENT],
    activeBg: 'bg-rose-500',
    inactiveBg: 'bg-rose-50 border border-rose-200',
    iconColor: '#dc2626',
    activeIconColor: '#ffffff',
    Icon: XCircle,
  },
];

// Props:
//   - currentStatus: status actual ('present' | 'late' | 'absent' | null).
//   - onSelect: callback(status). Si el usuario pulsa el mismo
//     status, se le pasa null (toggle off).
const AttendanceButtonGroup = ({ currentStatus, onSelect }) => {
  return (
    <View className="flex-row gap-2">
      {STATUS_BUTTONS.map((btn) => {
        const isActive = currentStatus === btn.status;
        const Icon = btn.Icon;
        return (
          <TouchableOpacity
            key={btn.status}
            onPress={() => onSelect(isActive ? null : btn.status)}
            className={clsx(
              'flex-1 py-2.5 rounded-lg items-center flex-row justify-center',
              isActive ? btn.activeBg : btn.inactiveBg,
            )}
            accessibilityRole="button"
            accessibilityLabel={`Marcar como ${btn.label}`}
            accessibilityState={{ selected: isActive }}
          >
            <Icon
              size={20}
              color={isActive ? btn.activeIconColor : btn.iconColor}
              strokeWidth={2.25}
            />
            <Text
              className={clsx(
                'text-xs ml-1',
                isActive ? 'text-white font-bold' : 'text-slate-700 font-semibold',
              )}
            >
              {btn.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default AttendanceButtonGroup;
