// =====================================================================
// Screen.jsx
// ---------------------------------------------------------------------
// Wrapper de pantalla que encapsula el patrón repetido en casi todas
// las pantallas: SafeAreaView + (ScrollView | FlatList) + KeyboardAvoidingView
// opcional. Centraliza los defaults para que cada pantalla solo
// piense en su contenido.
// =====================================================================

// React.
import React from 'react';

// Primitivas RN: SafeAreaView, KeyboardAvoidingView, ScrollView,
// Platform, View, RefreshControl.
import {
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
  RefreshControl,
} from 'react-native';

// clsx.
import { clsx } from 'clsx';

// Props:
//   - children: contenido de la pantalla.
//   - scroll: boolean. Si true, envuelve en ScrollView.
//   - keyboardAvoid: boolean. Si true, añade KeyboardAvoidingView.
//   - refreshing, onRefresh: si se pasan, añade RefreshControl.
//   - edges: array de edges para SafeAreaView (default ['top']).
//   - background: clase de fondo (default 'bg-slate-50').
//   - contentClassName: clases extra para el ScrollView.
//   - bottomAction: nodo opcional que se renderiza como absolute
//     en la parte inferior (e.g. botón "Enviar" fijo).
const Screen = ({
  children,
  scroll = true,
  keyboardAvoid = false,
  refreshing = false,
  onRefresh = null,
  edges = ['top'],
  background = 'bg-slate-50',
  contentClassName = '',
  bottomAction = null,
  contentContainerStyle = null,
}) => {
  // RefreshControl solo si se pasa onRefresh. Lo construimos una
  // sola vez para no recrearlo en cada render.
  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      // Color del spinner. slate-900 = institucional.
      colors={['#0f172a']}
      tintColor="#0f172a"
    />
  ) : undefined;

  // Si NO hay scroll ni keyboardAvoid, devolvemos solo el
  // SafeAreaView con children. Más simple y rápido.
  if (!scroll && !keyboardAvoid) {
    return (
      <SafeAreaView className={clsx('flex-1', background)} edges={edges}>
        {children}
        {/* bottomAction se posiciona absolute por encima del contenido. */}
        {bottomAction}
      </SafeAreaView>
    );
  }

  // Wrapper interno: el contenido (scrollable o no) va dentro del
  // KeyboardAvoidingView si keyboardAvoid es true.
  const ContentWrapper = keyboardAvoid ? KeyboardAvoidingView : React.Fragment;
  const contentWrapperProps = keyboardAvoid
    ? {
        behavior: Platform.OS === 'ios' ? 'padding' : 'height',
        className: 'flex-1',
        keyboardVerticalOffset: Platform.OS === 'ios' ? 0 : 20,
      }
    : null;

  return (
    <SafeAreaView className={clsx('flex-1', background)} edges={edges}>
      <ContentWrapper {...contentWrapperProps}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            // contentContainerStyle con flexGrow:1 para que el
            // contenido ocupe toda la pantalla si es corto.
            contentContainerStyle={[
              { flexGrow: 1 },
              contentContainerStyle,
            ]}
            refreshControl={refreshControl}
            keyboardShouldPersistTaps={keyboardAvoid ? 'handled' : undefined}
            className={clsx('flex-1', contentClassName)}
          >
            {children}
          </ScrollView>
        ) : (
          <View className="flex-1">{children}</View>
        )}
      </ContentWrapper>
      {/* bottomAction absolute sobre el contenido. */}
      {bottomAction}
    </SafeAreaView>
  );
};

export default Screen;
