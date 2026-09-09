// =====================================================================
// app/(teacher)/_components/InclusionModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet que muestra la Ficha de Inclusión y Salud del
// alumno. Disparado desde el "Inclusion Trigger Button" en file.jsx.
//
// Secciones del modal (en orden):
//   1. Estilo de Aprendizaje     (badge cyan + hint descriptivo).
//   2. Consideración Físico/Sensorial (alerts tipo 'visual' / 'aud').
//   3. Atención Especial / USAER (alerts tipo 'medical' / 'usaer').
//
// Si una sección no tiene alerts, muestra "Sin alertas registradas".
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';

// Iconos Lucide.
import {
  X,             // Cerrar.
  Eye,           // Header / visual alert.
  Brain,         // Estilo de Aprendizaje header.
  Stethoscope,   // Alerta médica.
  Puzzle,        // Alerta USAER.
  AlertCircle,   // Auditivo (genérico).
} from 'lucide-react-native';

// ---------------------------------------------------------------------
// ALERT_CONFIG
// ---------------------------------------------------------------------
// Mapeo de alert.type → { Icon, color }.
//   visual  → sky/cyan
//   aud     → → amber (auditivo)
//   medical → → rose
//   usaer   → → purple
// ---------------------------------------------------------------------
const ALERT_CONFIG = {
  visual:  { Icon: Eye,         color: '#0EA5E9' },
  aud:     { Icon: AlertCircle, color: '#D97706' },
  medical: { Icon: Stethoscope, color: '#DC2626' },
  usaer:   { Icon: Puzzle,      color: '#7C3AED' },
};

const InclusionModal = ({ isVisible, onClose, pedagogical }) => {
  // Filtramos las alerts por sección (si no hay data, arrays vacíos).
  const physicalSensoryAlerts = (pedagogical?.alerts || []).filter(
    (a) => a.type === 'visual' || a.type === 'aud',
  );
  const specialAttentionAlerts = (pedagogical?.alerts || []).filter(
    (a) => a.type === 'medical' || a.type === 'usaer',
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        className="flex-1"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        {/* Backdrop: tap fuera cierra el modal. */}
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityLabel="Cerrar modal de inclusión"
        />

        {/* Sheet. */}
        <View
          className="bg-white rounded-t-3xl"
          style={{ maxHeight: '85%' }}
        >
          {/* Drag handle. */}
          <View className="items-center pt-3 pb-1">
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#CBD5E1',
                borderRadius: 2,
              }}
            />
          </View>

          <ScrollView
            className="px-5 pb-6"
            showsVerticalScrollIndicator={false}
          >
            {/* ============================================================
                HEADER (título + close X)
                ============================================================ */}
            <View className="flex-row items-center justify-between mt-2 mb-4">
              <View className="flex-row items-center flex-1">
                <View
                  className="items-center justify-center"
                  style={{
                    backgroundColor: '#FEF3C7',
                    padding: 8,
                    borderRadius: 12,
                  }}
                >
                  <Eye size={20} color="#D97706" strokeWidth={2.25} />
                </View>
                <Text
                  className="ml-3 text-slate-900 flex-1"
                  style={{ fontSize: 17, fontWeight: '700' }}
                  numberOfLines={2}
                >
                  Ficha de Inclusión y Salud
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                className="items-center justify-center"
                style={{ padding: 6 }}
              >
                <X size={22} color="#64748B" strokeWidth={2.25} />
              </Pressable>
            </View>

            {/* ============================================================
                1. ESTILO DE APRENDIZAJE
                ============================================================ */}
            <SectionTitle icon={Brain} color="#D97706">
              Estilo de Aprendizaje
            </SectionTitle>
            <View
              className="bg-white rounded-2xl p-4 mb-4 border border-slate-100"
              style={{
                shadowColor: '#0F172A',
                shadowOpacity: 0.04,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              {pedagogical?.learningStyle ? (
                <>
                  <View
                    className="self-start px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#0284C7' }}
                  >
                    <Text
                      className="text-white"
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        letterSpacing: 1,
                      }}
                    >
                      {pedagogical.learningStyle}
                    </Text>
                  </View>
                  <Text
                    className="mt-2 text-slate-700"
                    style={{ fontSize: 13, fontWeight: '500' }}
                  >
                    {pedagogical.styleHint}
                  </Text>
                </>
              ) : (
                <Text className="text-slate-400" style={{ fontSize: 13, fontWeight: '500' }}>
                  Sin datos registrados
                </Text>
              )}
            </View>

            {/* ============================================================
                2. CONSIDERACIÓN FÍSICO/SENSORIAL
                ============================================================ */}
            <SectionTitle>
              Consideración Físico/Sensorial
            </SectionTitle>
            <AlertList
              alerts={physicalSensoryAlerts}
              emptyText="Sin alertas registradas"
            />

            {/* ============================================================
                3. ATENCIÓN ESPECIAL / USAER
                ============================================================ */}
            <SectionTitle>
              Atención Especial / USAER
            </SectionTitle>
            <AlertList
              alerts={specialAttentionAlerts}
              emptyText="Sin alertas registradas"
            />

            {/* ============================================================
                ALERGIAS / CUIDADOS ESPECIALES (opcional)
                ============================================================
                Se muestra como sección extra solo si el alumno tiene
                alergias registradas en el file mock.
                ============================================================ */}
            {pedagogical?.allergies ? (
              <>
                <SectionTitle>
                  Alergias o Cuidados Especiales
                </SectionTitle>
                <View
                  className="rounded-xl p-3 mb-4 flex-row items-center"
                  style={{
                    backgroundColor: '#FEF2F2',
                    borderWidth: 1,
                    borderColor: '#FECACA',
                  }}
                >
                  <AlertCircle
                    size={18}
                    color="#DC2626"
                    strokeWidth={2.25}
                  />
                  <Text
                    className="flex-1 ml-3 text-rose-900"
                    style={{ fontSize: 13, fontWeight: '600' }}
                  >
                    {pedagogical.allergies}
                  </Text>
                </View>
              </>
            ) : null}

            {/* ============================================================
                BOTÓN CERRAR (sticky al final)
                ============================================================ */}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              className="items-center justify-center rounded-xl mt-2"
              style={{
                backgroundColor: '#0284C7',
                paddingVertical: 12,
              }}
            >
              <Text
                className="text-white"
                style={{ fontSize: 14, fontWeight: '700' }}
              >
                Cerrar
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------
// SUBCOMPONENTES LOCALES (no se exportan; solo viven aquí)
// ---------------------------------------------------------------------

// Title de sección: solo texto (uppercase, slate-500).
const SectionTitle = ({ children }) => (
  <Text
    className="text-slate-500 mt-4 mb-2"
    style={{
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}
  >
    {children}
  </Text>
);

// Lista de alerts con su icono tintado + título + subtitle. Renderiza
// empty state si la lista está vacía.
const AlertList = ({ alerts, emptyText }) => {
  if (alerts.length === 0) {
    return (
      <View
        className="bg-white rounded-2xl p-6 items-center mb-4 border border-slate-100"
        style={{
          shadowColor: '#0F172A',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        <Text
          className="text-slate-500"
          style={{ fontSize: 13, fontWeight: '600' }}
        >
          {emptyText}
        </Text>
      </View>
    );
  }
  return (
    <View
      className="bg-white rounded-2xl p-2 mb-4 border border-slate-100"
      style={{
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      {alerts.map((alert, index) => {
        const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.aud;
        const { Icon, color } = config;
        return (
          <View
            key={alert.id}
            className="flex-row items-center p-2"
            style={
              index < alerts.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }
                : undefined
            }
          >
            <View
              className="items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: `${color}15`, // ~8% opacity.
              }}
            >
              <Icon size={20} color={color} strokeWidth={2.25} />
            </View>
            <View className="flex-1 ml-3">
              <Text
                className="text-slate-900"
                style={{ fontSize: 13, fontWeight: '700' }}
              >
                {alert.title}
              </Text>
              <Text
                className="text-slate-500 mt-0.5"
                style={{ fontSize: 12, fontWeight: '500' }}
              >
                {alert.subtitle}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default InclusionModal;