// =====================================================================
// app/(teacher)/_components/SocialWorkTab.jsx
// ---------------------------------------------------------------------
// Tab "Trabajo Social y Bitácora" del Expediente del Alumno. Contiene:
//
//   1. Seguimiento Trabajo Social (timeline read-only): bullet cyan
//      + vertical line + fecha en sky + descripción.
//   2. Bitácora Privada del Docente: input + history de notas.
//
// El estado de las notas privadas es LOCAL (useState). Cuando exista
// el endpoint, se persistirá vía POST.
// =====================================================================

// React + hooks.
import React, { useState } from 'react';

// Primitivas RN.
import {
  View,
  Text,
  TextInput,
  Pressable,
} from 'react-native';

// Iconos Lucide.
import { Plus } from 'lucide-react-native';

// clsx.
import { clsx } from 'clsx';

// ---------------------------------------------------------------------
// Helpers locales
// ---------------------------------------------------------------------
// Devuelve la fecha de hoy formateada como 'DD / Mes / YYYY' (mismo
// formato que el resto del file mock).
const todayLabel = () => {
  const d = new Date();
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} / ${months[d.getMonth()]} / ${d.getFullYear()}`;
};

const SocialWorkTab = ({ file }) => {
  // ============================================================
  // STATE: bitácora privada (notas del docente para este alumno)
  // ============================================================
  const [notes, setNotes] = useState(file.teacherNotes || []);
  const [draft, setDraft] = useState('');

  // Handler: agrega el draft al inicio del historial (más reciente
  // arriba) y limpia el input.
  const handleAddNote = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const newNote = {
      id: `tn-${Date.now()}`,
      date: todayLabel(),
      text: trimmed,
    };
    setNotes([newNote, ...notes]);
    setDraft('');
  };

  return (
    <View className="mx-4 mt-3">
      {/* ============================================================
          SEGUIMIENTO TRABAJO SOCIAL (timeline)
          ============================================================
          Layout Stitch: bullet cyan + vertical line + fecha en sky
          + descripción. La última entrada no lleva línea vertical.
          ============================================================ */}
      <Text
        className="text-slate-500 mb-3"
        style={{
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Seguimiento Trabajo Social
      </Text>

      {file.socialWork && file.socialWork.length > 0 ? (
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
          {file.socialWork.map((note, index) => {
            const isLast = index === file.socialWork.length - 1;
            return (
              <View key={note.id} className="flex-row">
                {/* Columna timeline: bullet + vertical line. */}
                <View className="items-center mr-3" style={{ width: 14 }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#0284C7',
                      marginTop: 4,
                    }}
                  />
                  {!isLast ? (
                    <View
                      style={{
                        flex: 1,
                        width: 2,
                        backgroundColor: '#E2E8F0',
                        marginTop: 4,
                      }}
                    />
                  ) : null}
                </View>

                {/* Contenido: fecha + descripción. */}
                <View className={clsx('flex-1', !isLast && 'pb-4')}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: '#0284C7',
                    }}
                  >
                    {note.date}
                  </Text>
                  <Text
                    className="mt-1 text-slate-900"
                    style={{ fontSize: 13, fontWeight: '500' }}
                  >
                    {note.text}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
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
            Sin avisos registrados
          </Text>
        </View>
      )}

      {/* ============================================================
          BITÁCORA PRIVADA DEL DOCENTE (input + history)
          ============================================================ */}
      <Text
        className="text-slate-500 mb-2 mt-2"
        style={{
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        Bitácora Privada del Docente
      </Text>

      {/* Input card. */}
      <View
        className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"
        style={{
          shadowColor: '#0F172A',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribe una nota privada sobre este alumno en esta materia..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="text-slate-900 px-3 py-2.5 rounded-lg"
          style={{
            backgroundColor: '#F8FAFC',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            minHeight: 80,
            fontSize: 13,
          }}
          accessibilityLabel="Nueva nota privada"
        />

        <Pressable
          onPress={handleAddNote}
          disabled={!draft.trim()}
          accessibilityRole="button"
          accessibilityLabel="Guardar nota privada"
          className="flex-row items-center justify-center mt-2 py-2.5 rounded-lg"
          style={{
            backgroundColor: draft.trim() ? '#0284C7' : '#CBD5E1',
          }}
        >
          <Plus size={16} color="#ffffff" strokeWidth={2.25} />
          <Text
            className="text-white ml-1.5"
            style={{ fontSize: 13, fontWeight: '700' }}
          >
            Guardar Nota
          </Text>
        </Pressable>
      </View>

      {/* Historial. */}
      {notes.length > 0 ? (
        notes.map((note, index) => (
          <View
            key={note.id}
            className={clsx(
              'bg-white rounded-xl p-3 mb-2 border border-slate-100',
              // La nota más reciente lleva el accent cyan a la izq.
              index === 0 && 'border-l-4 border-l-sky-500',
            )}
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
              style={{
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.3,
              }}
            >
              {note.date}
            </Text>
            <Text
              className="mt-1 text-slate-900"
              style={{ fontSize: 13, fontWeight: '500' }}
            >
              {note.text}
            </Text>
          </View>
        ))
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
            Sin notas registradas
          </Text>
          <Text
            className="text-slate-400 mt-1 text-center"
            style={{ fontSize: 11 }}
          >
            Escribe tu primera nota arriba.
          </Text>
        </View>
      )}
    </View>
  );
};

export default SocialWorkTab;