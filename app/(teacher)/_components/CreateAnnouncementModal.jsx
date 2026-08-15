// =====================================================================
// app/(teacher)/_components/CreateAnnouncementModal.jsx
// ---------------------------------------------------------------------
// Modal bottom-sheet "Crear Nuevo Aviso" del MAESTRO.
//
// Slide-up modal que reúne el formulario de creación de un aviso
// dirigido a los tutores. Sigue fielmente el spec de diseño:
//   - Overlay oscuro rgba(15,23,42,0.4); tap fuera cierra el modal.
//   - Bottom sheet blanco con esquinas superiores redondeadas (28).
//   - Handle (pill) superior centrado como affordance de drag.
//   - Header con título + botón X (cerrar).
//   - Form: destinatarios (chips multi-select), prioridad de 2
//     niveles (INFORMATIVO | URGENTE), título, mensaje.
//   - Bottom actions: "Publicar Aviso" (primario) + "Guardar como
//     borrador" (secundario).
//
// DATA SOURCE (grupos): el padre pasa `groups` como prop — la lista
// de grupos asignados al maestro (1° OFIMÁTICA, 3° OFIMÁTICA,
// 3°A (Tutoría)). En esta fase de prototipo los grupos vienen del
// mock de la pantalla (MOCK_GROUPS); cuando exista el endpoint
// GET /teacher-subjects/me/groups se migrará sin tocar el modal.
//
// SUBMIT: al validar (≥1 grupo + título + mensaje no vacíos) se
// dispara createTeacherAnnouncement() de src/services/teacherService.js
// con la estructura estricta de prioridad de 2 niveles:
//   priority: "INFORMATIVO" | "URGENTE"
// =====================================================================

// React hooks.
import React, { useState, useCallback, useEffect } from 'react';

// Primitivas RN: Modal, View, Text, Pressable, ScrollView, TextInput,
// KeyboardAvoidingView, Platform, Alert, ActivityIndicator.
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';

// Safe area: paddingBottom para respetar el home indicator de iOS.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Iconos Lucide.
import { X, Check, Send } from 'lucide-react-native';

// Servicio: crea el aviso contra el backend del maestro.
import { createTeacherAnnouncement } from '../../../src/services/teacherService';

// ---------------------------------------------------------------------
// CONSTANTES DE PRIORIDAD (estructura estricta de 2 niveles)
// ---------------------------------------------------------------------
// El backend SOLO acepta estos dos valores. NO inventar niveles
// intermedios. Se usan tanto para el estado local como para el body
// del POST.
const PRIORITY_LEVELS = {
  INFORMATIVO: 'INFORMATIVO',
  URGENTE: 'URGENTE',
};

// Opciones del segmented control. `value` es el valor estricto que
// envía el backend (2 niveles); `label` es el texto visible.
const PRIORITY_OPTIONS = [
  { value: PRIORITY_LEVELS.INFORMATIVO, label: 'Informativo' },
  { value: PRIORITY_LEVELS.URGENTE, label: 'Urgente' },
];

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
// Props:
//   - visible: boolean. Controla la visibilidad del <Modal>.
//   - onClose: () => void. Cierra el modal (X, overlay, Android back).
//   - groups: array de { id: string, label: string }. Grupos destino
//     disponibles (grupos asignados al maestro).
//   - onPublished: (item) => void. Opcional; se llama tras publicar
//     con el item creado para que la pantalla actualice el feed.
export default function CreateAnnouncementModal({
  visible,
  onClose,
  groups = [],
  onPublished = null,
}) {
  const insets = useSafeAreaInsets();

  // -------------------------------------------------------------------
  // ESTADO LOCAL DEL FORMULARIO
  // -------------------------------------------------------------------
  // groupIds: ids de los grupos seleccionados (multi-select). Vacío
  // inicialmente — la validación exige al menos uno.
  const [groupIds, setGroupIds] = useState([]);
  // priority: prioridad del aviso. Default "INFORMATIVO" (nivel bajo).
  const [priority, setPriority] = useState(PRIORITY_LEVELS.INFORMATIVO);
  // title: título del aviso.
  const [title, setTitle] = useState('');
  // content: mensaje para los tutores.
  const [content, setContent] = useState('');
  // isSubmitting: true mientras el POST está en vuelo. Deshabilita
  // los botones y muestra el spinner en "Publicar Aviso".
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------------
  // TOGGLE DE GRUPO (multi-select)
  // -------------------------------------------------------------------
  // Si el grupo ya está seleccionado, lo quitamos; si no, lo
  // añadimos. Toggle puro, sin límite de selección.
  const toggleGroup = useCallback((groupId) => {
    setGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  }, []);

  // -------------------------------------------------------------------
  // RESET DEL FORMULARIO
  // -------------------------------------------------------------------
  // Cada vez que el modal pasa de cerrado a visible, reseteamos los
  // campos para no heredar un borrador de la vez anterior. También
  // limpia el flag de submitting (por si se cerró en pleno POST).
  const resetForm = useCallback(() => {
    setGroupIds([]);
    setPriority(PRIORITY_LEVELS.INFORMATIVO);
    setTitle('');
    setContent('');
    setIsSubmitting(false);
  }, []);

  // Con el patrón visible/onClose el padre controla el estado; aquí
  // solo reseteamos cuando el modal se abre (de false → true).
  useEffect(() => {
    if (visible) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // -------------------------------------------------------------------
  // VALIDACIÓN
  // -------------------------------------------------------------------
  // La publicación exige: ≥1 grupo seleccionado + título no vacío +
  // contenido no vacío. Los textos se normalizan con trim para no
  // aceptar cadenas de solo espacios.
  const isFormValid =
    groupIds.length > 0 &&
    title.trim().length > 0 &&
    content.trim().length > 0;

  // -------------------------------------------------------------------
  // SUBMIT (publicar aviso)
  // -------------------------------------------------------------------
  // Dispara el POST solo si el formulario es válido. En esta fase de
  // prototipo el endpoint puede no existir aún; si falla mostramos
  // un Alert con el mensaje del servicio.
  const handlePublish = useCallback(async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        group_ids: groupIds,
        // Estructura estricta de 2 niveles de prioridad.
        priority,
        title: title.trim(),
        content: content.trim(),
      };
      const result = await createTeacherAnnouncement(payload);

      if (!result.success) {
        Alert.alert('No se pudo publicar el aviso', result.message);
        return;
      }

      // Éxito: notificamos al padre (si pasó callback) y cerramos.
      onPublished?.(result.data);
      onClose();
    } catch (err) {
      console.error('[CreateAnnouncementModal] error inesperado:', err);
      Alert.alert('Error inesperado', 'Ocurrió un error al publicar el aviso.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, isSubmitting, groupIds, priority, title, content, onPublished, onClose]);

  // -------------------------------------------------------------------
  // GUARDAR COMO BORRADOR
  // -------------------------------------------------------------------
  // Acción secundaria. En esta fase de prototipo no hay endpoint de
  // borradores; por consistencia mostramos un placeholder informativo.
  // Cuando el backend soporte borradores, aquí se haría el POST con
  // status "draft" en lugar del Alert.
  const handleSaveDraft = useCallback(() => {
    Alert.alert(
      'Guardar como borrador',
      'Esta función estará disponible cuando el backend soporte borradores de avisos.',
    );
  }, []);

  return (
    // <Modal> nativo: animationType="slide" lo desliza desde abajo.
    // transparent=true para que el overlay no tape la pantalla previa.
    // onRequestClose cubre el back button de Android.
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* KeyboardAvoidingView: empuja el sheet por encima del teclado
          cuando el usuario edita el mensaje (evita taparlo). */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Overlay oscuro rgba(15,23,42,0.4). Pressable de ancho
            completo: un tap FUERA del sheet cierra el modal. */}
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
          onPress={onClose}
          accessibilityLabel="Cerrar creación de aviso"
        >
          {/* Bottom sheet blanco. Pressable que ABSORBE el tap para
              que tocar dentro del sheet no cierre el modal (el
              onPress del padre se dispararía por propagación). */}
          <Pressable
            onPress={() => {}}
            className="bg-white w-full px-5"
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 12,
              maxHeight: '90%',
              paddingBottom: insets.bottom + 8,
            }}
          >
            {/* ==========================================================
                HANDLE (pill de arrastre)
                ==========================================================
                Barra centrada de 40x4 #CBD5E1, radius 2. Suggestor
                visual de que el sheet se puede arrastrar/cerrar.
                ========================================================== */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#CBD5E1',
                borderRadius: 2,
                marginBottom: 16,
                alignSelf: 'center',
              }}
            />

            {/* ==========================================================
                HEADER: Título + botón cerrar
                ==========================================================
                Título 20/700 #0F172A a la izquierda; botón circular
                32x32 #F1F5F9 con X #64748B a la derecha.
                ========================================================== */}
            <View className="flex-row items-center justify-between mb-5">
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>
                Crear Nuevo Aviso
              </Text>
              <Pressable
                onPress={onClose}
                className="items-center justify-center"
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9' }}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                hitSlop={8}
              >
                <X size={18} color="#64748B" strokeWidth={2.25} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ==========================================================
                  A) DESTINATARIOS
                  ==========================================================
                  Label uppercase + lista de chips multi-select.
                  ========================================================== */}
              <Text
                className="uppercase mb-2"
                style={{ fontSize: 12, fontWeight: '700', color: '#475569', letterSpacing: 0.5 }}
              >
                Destinatarios
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {groups.map((group) => {
                  const isSelected = groupIds.includes(group.id);
                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => toggleGroup(group.id)}
                      className="flex-row items-center"
                      style={{
                        backgroundColor: isSelected ? '#0284C7' : '#F1F5F9',
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`Grupo ${group.label}`}
                    >
                      {/* Check blanco solo en el chip seleccionado. */}
                      {isSelected && (
                        <Check size={16} color="#ffffff" strokeWidth={2.75} style={{ marginRight: 6 }} />
                      )}
                      <Text
                        style={{
                          color: isSelected ? '#ffffff' : '#334155',
                          fontWeight: isSelected ? '600' : '500',
                          fontSize: 13,
                        }}
                      >
                        {group.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* ==========================================================
                  B) NIVEL DE PRIORIDAD (segmented control 2 niveles)
                  ==========================================================
                  Contenedor #F1F5F9 radius 12 padding 4; cada opción
                  es flex:1. Activo: fondo suave + texto bold del color
                  de la variante. Inactivo: transparente + #64748B.
                  ========================================================== */}
              <Text
                className="uppercase mt-5 mb-2"
                style={{ fontSize: 12, fontWeight: '700', color: '#475569', letterSpacing: 0.5 }}
              >
                Nivel de Prioridad
              </Text>
              <View
                className="flex-row"
                style={{ backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 }}
              >
                {PRIORITY_OPTIONS.map((option) => {
                  const isActive = priority === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setPriority(option.value)}
                      className="flex-1 items-center justify-center py-2.5"
                      style={{
                        // Activo: fondo suave de la variante
                        // (#E0F2FE para Informativo, #FEE2E2 para
                        // Urgente). Inactivo: transparente.
                        backgroundColor: isActive
                          ? option.value === PRIORITY_LEVELS.URGENTE
                            ? '#FEE2E2'
                            : '#E0F2FE'
                          : 'transparent',
                        borderRadius: 8,
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={option.label}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isActive ? '700' : '400',
                          color: isActive
                            ? option.value === PRIORITY_LEVELS.URGENTE
                              ? '#DC2626'
                              : '#0284C7'
                            : '#64748B',
                        }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* ==========================================================
                  C) TÍTULO DEL AVISO
                  ========================================================== */}
              <Text
                className="uppercase mt-5 mb-2"
                style={{ fontSize: 12, fontWeight: '700', color: '#475569', letterSpacing: 0.5 }}
              >
                Título del aviso
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ej. Material para la siguiente clase de Ofimática"
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 14,
                  color: '#0F172A',
                }}
                maxLength={120}
              />

              {/* ==========================================================
                  D) MENSAJE PARA LOS TUTORES
                  ==========================================================
                  Textarea multiline de 110px, texto alineado arriba.
                  ========================================================== */}
              <Text
                className="uppercase mt-5 mb-2"
                style={{ fontSize: 12, fontWeight: '700', color: '#475569', letterSpacing: 0.5 }}
              >
                Mensaje para los tutores
              </Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Escribe los detalles de la tarea, aviso o indicación para los padres de familia..."
                placeholderTextColor="#94A3B8"
                multiline
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 14,
                  height: 110,
                  textAlignVertical: 'top',
                  color: '#0F172A',
                }}
                maxLength={1000}
              />

              {/* ==========================================================
                  BOTTOM ACTIONS
                  ==========================================================
                  1. Botón primario full-width 52px #0284C7 radius 16.
                     Muestra spinner (Loader2) mientras envía.
                  2. "Guardar como borrador" (texto secundario).
                  ========================================================== */}
              <Pressable
                onPress={handlePublish}
                disabled={isSubmitting}
                className="flex-row items-center justify-center"
                style={{
                  backgroundColor: isSubmitting ? '#7DD3FC' : '#0284C7',
                  height: 52,
                  borderRadius: 16,
                  marginTop: 20,
                }}
                accessibilityRole="button"
                accessibilityLabel="Publicar aviso"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    {/* Icono Send blanco rotado (affordance de envío). */}
                    <Send
                      size={18}
                      color="#ffffff"
                      strokeWidth={2.25}
                      style={{ transform: [{ rotate: '-15deg' }], marginRight: 8 }}
                    />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#ffffff' }}>
                      Publicar Aviso
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Acción secundaria: guardar como borrador. */}
              <Pressable
                onPress={handleSaveDraft}
                className="items-center py-3"
                style={{ marginTop: 14, marginBottom: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Guardar como borrador"
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748B' }}>
                  Guardar como borrador
                </Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
