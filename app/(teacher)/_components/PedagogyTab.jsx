// =====================================================================
// app/(teacher)/_components/PedagogyTab.jsx
// ---------------------------------------------------------------------
// Tab "Perfil Pedagógico y Salud (Inclusión)" del Expediente del
// Alumno. Muestra la ficha de inclusión:
//
//   1. Estilo de aprendizaje (card highlighted con border-left accent
//      amber, badge "ESTILO DE APRENDIZAJE", título bold y hint).
//   2. Consideraciones médicas y físicas (lista de alerts con
//      iconos temáticos: visual = sky, médico = rose, USAER = purple).
//   3. Alergias o cuidados especiales (warning box, opcional).
// =====================================================================

// React.
import React from 'react';

// Primitivas RN.
import { View, Text } from 'react-native';

// Iconos Lucide.
import {
  Eye,           // Alert visual.
  Stethoscope,   // Alert médico.
  Puzzle,        // Alert USAER / Apoyo.
  Brain,         // Header del card Estilo de Aprendizaje.
  AlertTriangle, // Alergias / cuidados especiales.
} from 'lucide-react-native';

// Mapeo de alert.type → { Icon, color } (Stitch design palette):
//   - 'visual' → sky/cyan  (azul claro).
//   - 'medical' → rose/red (rojo claro).
//   - 'usaer'   → purple   (morado).
const ALERT_ICONS = {
  visual: { Icon: Eye,         color: '#0EA5E9' },
  medical: { Icon: Stethoscope, color: '#DC2626' },
  usaer: { Icon: Puzzle,       color: '#7C3AED' },
};

const PedagogyTab = ({ file }) => {
  const ped = file.pedagogical;

  return (
    <View className="mx-4 mt-3">
      {/* ============================================================
          ESTILO DE APRENDIZAJE (highlighted card con left border)
          ============================================================
          Layout Stitch:
            - borderLeftWidth 4 amber (#D97706) — accent vertical.
            - Header: Brain icon + label "ESTILO DE APRENDIZAJE".
            - Título bold grande con el estilo (e.g. "VISUAL / KINESTÉSICO").
            - Hint descriptivo abajo.
          ============================================================ */}
      <View
        className="bg-white rounded-2xl p-4 border border-slate-100"
        style={{
          borderLeftWidth: 4,
          borderLeftColor: '#D97706',
          shadowColor: '#0F172A',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        {/* Header: Brain icon + label. */}
        <View className="flex-row items-center">
          <Brain size={16} color="#D97706" strokeWidth={2.25} />
          <Text
            className="ml-2 text-slate-500"
            style={{
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Estilo de Aprendizaje
          </Text>
        </View>

        {/* Título con el estilo (puede incluir "/"). */}
        <Text
          className="mt-2 text-slate-900"
          style={{ fontSize: 18, fontWeight: '800' }}
          numberOfLines={2}
        >
          {ped.learningStyle}
        </Text>

        {/* Hint descriptivo. */}
        <Text
          className="mt-2 text-slate-700"
          style={{ fontSize: 13, fontWeight: '500' }}
        >
          {ped.styleHint}
        </Text>
      </View>

      {/* ============================================================
          CONSIDERACIONES MÉDICAS Y FÍSICAS
          ============================================================
          Sección title + lista de alerts. Cada alert tiene icon bg
          tintado + título bold + subtitle pequeño.
          ============================================================ */}
      <Text
        className="text-slate-500 mt-5 mb-2"
        style={{
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Consideraciones Médicas y Físicas
      </Text>

      {ped.alerts && ped.alerts.length > 0 ? (
        <View
          className="bg-white rounded-2xl p-2 border border-slate-100"
          style={{
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          {ped.alerts.map((alert, index) => {
            const config = ALERT_ICONS[alert.type] || ALERT_ICONS.visual;
            const { Icon, color } = config;
            return (
              <View
                key={alert.id}
                className="flex-row items-center p-2"
                style={
                  index < ped.alerts.length - 1
                    ? {
                        borderBottomWidth: 1,
                        borderBottomColor: '#F1F5F9',
                      }
                    : undefined
                }
              >
                {/* Icono temático con fondo tintado. */}
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

                {/* Título + subtitle en stack vertical. */}
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
      ) : (
        <View
          className="bg-white rounded-2xl p-6 items-center border border-slate-100"
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
            Sin consideraciones registradas
          </Text>
        </View>
      )}

      {/* ============================================================
          ALERGIAS O CUIDADOS ESPECIALES (opcional)
          ============================================================ */}
      {ped.allergies ? (
        <>
          <Text
            className="text-slate-500 mt-5 mb-2"
            style={{
              fontSize: 11,
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Alergias o Cuidados Especiales
          </Text>
          <View
            className="rounded-xl p-3 flex-row items-center"
            style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
            }}
          >
            <AlertTriangle size={18} color="#DC2626" strokeWidth={2.25} />
            <Text
              className="flex-1 ml-3 text-rose-900"
              style={{ fontSize: 13, fontWeight: '600' }}
            >
              {ped.allergies}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
};

export default PedagogyTab;