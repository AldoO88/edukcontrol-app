// =====================================================================
// app/(teacher)/_components/DirectoryToolbar.jsx
// ---------------------------------------------------------------------
// Toolbar de la pantalla Directorio y Expediente de Alumnos. Dos
// controles en una misma fila:
//
//   ┌─────────────────────────────────────────┐ ┌───┐
//   │ 🔍  Buscar alumno por nombre, N.L. ...  │ │ ⚙ │
//   └─────────────────────────────────────────┘ └───┘
//      Search input (flex-1)                   filter
//
// El botón de filtros (icono SlidersHorizontal) abre un menú modal
// con 3 criterios de ordenamiento:
//
//   1. N.° de lista               (default — orden original)
//   2. Promedio (mayor a menor)   (averageDesc)
//   3. Promedio (menor a mayor)   (averageAsc)
//
// El criterio activo se marca con check + color sky-600. El botón
// también cambia de color cuando hay un sort distinto del default
// (fondo #E0F2FE + icono #0284C7) para que sirva de "indicador
// de estado".
//
// Vista SIEMPRE en formato lista (numColumns=1, sin toggle).
//
// Props:
//   - searchTerm:     string — valor actual del search.
//   - setSearchTerm:  fn(string) — setter del search.
//   - sortBy:         string — id del criterio de ordenamiento.
//   - setSortBy:      fn(string) — setter del sort.
// =====================================================================

// React.
import React, { useState, useRef } from 'react';

// Primitivas RN: View, Text, TextInput, Pressable, Modal.
import { View, Text, TextInput, Pressable, Modal } from 'react-native';

// Iconos Lucide.
import {
  Search,           // Icono del search input.
  SlidersHorizontal,// Icono del botón de filtros.
  ListOrdered,      // Opción: N.° de lista.
  ArrowDown,        // Opción: promedio mayor a menor.
  ArrowUp,          // Opción: promedio menor a mayor.
  Check,            // Indicador de opción activa.
} from 'lucide-react-native';

// clsx para componer classNames condicionales.
import { clsx } from 'clsx';

// IDs de los criterios de ordenamiento. Single source of truth
// exportada desde el hook (sortBy ids coinciden).
import { SORT_OPTIONS } from '../../../src/hooks/useGroupStudentsDirectory';

// Iconos asociados a cada opción de ordenamiento. El toolbar es
// quien decide la presentación visual (iconos + labels + posición);
// el hook solo conoce el id.
const SORT_ICONS = {
  listNumber: ListOrdered,
  averageDesc: ArrowDown,
  averageAsc: ArrowUp,
};

const DirectoryToolbar = ({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
}) => {
  // Estado del menú modal: abierto/cerrado.
  const [menuOpen, setMenuOpen] = useState(false);

  // Ref al botón de filtros para capturar su posición en pantalla
  // y anclar el menú justo debajo de él.
  const filterButtonRef = useRef(null);
  const [buttonRect, setButtonRect] = useState(null);

  // Abrir el menú: medimos la posición del botón en coordenadas de
  // ventana y la guardamos para posicionar el modal.
  const openMenu = () => {
    if (filterButtonRef.current) {
      filterButtonRef.current.measureInWindow((x, y, width, height) => {
        setButtonRect({ x, y, width, height });
        setMenuOpen(true);
      });
    }
  };

  // Seleccionar un criterio de ordenamiento y cerrar el menú.
  const handleSelect = (id) => {
    setSortBy(id);
    setMenuOpen(false);
  };

  // Bandera: el sort activo es distinto del default → pintamos el
  // botón en estado "activo" (azul claro) como indicador visual.
  const isSortActive = sortBy !== 'listNumber';

  return (
    <View>
      {/* ============================================================
          ROW DE CONTROLES (search + filter)
          ============================================================ */}
      <View className="flex-row items-center">
        {/* SEARCH INPUT (flex-1). */}
        <View
          className="flex-row items-center rounded-[14px] px-3"
          style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            height: 44,
          }}
        >
          <Search size={18} color="#94A3B8" strokeWidth={2} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Buscar alumno por nombre, N.L. o No. de Control..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-2 text-[13px] text-slate-900"
            accessibilityLabel="Buscar alumno"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* FILTER BUTTON — abre el menú de ordenamiento. */}
        <Pressable
          ref={filterButtonRef}
          onPress={openMenu}
          accessibilityRole="button"
          accessibilityLabel="Filtros y ordenamiento"
          accessibilityState={{ expanded: menuOpen }}
          className="items-center justify-center ml-2"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            // Fondo: gris #F1F5F9 por default, sky-50 cuando hay
            // un sort activo (indicador de estado).
            backgroundColor: isSortActive ? '#E0F2FE' : '#F1F5F9',
          }}
        >
          <SlidersHorizontal
            size={18}
            // Color del icono: gris por default, sky-600 cuando
            // hay un sort activo.
            color={isSortActive ? '#0284C7' : '#475569'}
            strokeWidth={2.25}
          />
        </Pressable>
      </View>

      {/* ============================================================
          MENÚ MODAL DE ORDENAMIENTO
          ============================================================
          Modal transparente full-screen con backdrop slate-900/50.
          Tap fuera del menú → cierra. position: absolute para anclar
          el card al botón de filtros (capturamos buttonRect al
          abrir).
          ============================================================ */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          className="flex-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
          onPress={() => setMenuOpen(false)}
        >
          {buttonRect ? (
            <View
              style={{
                position: 'absolute',
                top: buttonRect.y + buttonRect.height + 8,
                right: 16,
                width: 260,
              }}
            >
              <View
                className="bg-white rounded-2xl"
                style={{
                  shadowColor: '#0F172A',
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 8,
                }}
              >
                {/* Header de sección. */}
                <View className="px-4 py-3 border-b border-slate-100">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Ordenar por
                  </Text>
                </View>

                {/* Opciones de ordenamiento. */}
                {SORT_OPTIONS.map((option, index) => {
                  const Icon = SORT_ICONS[option.id] || ListOrdered;
                  const isActive = sortBy === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => handleSelect(option.id)}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected: isActive }}
                      className={clsx(
                        'flex-row items-center px-4 py-3',
                        index < SORT_OPTIONS.length - 1 &&
                          'border-b border-slate-100',
                      )}
                    >
                      <Icon
                        size={16}
                        color={isActive ? '#0284C7' : '#64748B'}
                        strokeWidth={2.25}
                      />
                      <Text
                        className={clsx(
                          'flex-1 ml-3 text-sm',
                          isActive
                            ? 'text-sky-600 font-semibold'
                            : 'text-slate-700',
                        )}
                      >
                        {option.label}
                      </Text>
                      {isActive ? (
                        <Check size={16} color="#0284C7" strokeWidth={2.5} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
};

export default DirectoryToolbar;
