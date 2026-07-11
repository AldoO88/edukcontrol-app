// =====================================================================
// SendMessageScreen.jsx
// ---------------------------------------------------------------------
// Pantalla para enviar un mensaje a uno o varios padres de familia.
// Refactorizado para usar useSelection (multi-select) y los
// componentes Screen, ScreenHeader, RecipientItem, TextField y Button.
// =====================================================================

// React.
import React, { useState, useCallback } from 'react';

// Primitivas RN: View, Text, ScrollView, TextInput, Alert.
import { View, Text, TextInput, Alert } from 'react-native';

// Iconos.
import { Send, MessageSquare, Check } from 'lucide-react-native';

// Componentes reutilizables.
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import Card from '../../components/Card';
import RecipientItem from '../../components/RecipientItem';
import Button from '../../components/Button';

// Hooks.
import { useSelection } from '../../hooks/useSelection';

// Constante: máximo de caracteres del mensaje.
const MAX_MESSAGE_LENGTH = 500;

// Componente principal.
const SendMessageScreen = ({ navigation }) => {
  // message: contenido del mensaje.
  const [message, setMessage] = useState('');

  // sending: estado de envío.
  const [sending, setSending] = useState(false);

  // useSelection: hook para multi-select de destinatarios.
  // Inicialmente vacío, con la lista completa de recipients como
  // universo seleccionable.
  const {
    isSelected,
    toggle,
    selectAll,
    count,
    asArray,
  } = useSelection([], recipients.map((r) => r.id));

  // isAllSelected: derivado. Si está vacío, no.
  const isAllSelected = count === recipients.length;

  // handleSend: envía el mensaje.
  const handleSend = useCallback(async () => {
    // Validación: debe haber al menos un destinatario.
    if (count === 0) {
      Alert.alert('Sin destinatarios', 'Selecciona al menos un padre de familia.');
      return;
    }
    // Validación: el mensaje no puede estar vacío.
    const trimmed = message.trim();
    if (!trimmed) {
      Alert.alert('Mensaje vacío', 'Escribe el contenido del mensaje.');
      return;
    }

    setSending(true);
    try {
      // Aquí iría: await api.post('/messages', {
      //   recipients: asArray,
      //   body: trimmed,
      // });
      await new Promise((resolve) => setTimeout(resolve, 800));
      Alert.alert(
        'Mensaje enviado',
        `Se envió correctamente a ${count} destinatario(s).`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el mensaje. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  }, [count, message, asArray, navigation]);

  return (
    <Screen>
      {/* Header con icono. */}
      <ScreenHeader
        title="Enviar mensaje"
        icon={MessageSquare}
      />

      {/* Sección de destinatarios. */}
      <View className="px-6 pt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-slate-700 text-sm font-semibold">
            Destinatarios ({count})
          </Text>
          <Button
            title={isAllSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
            onPress={selectAll}
            variant="ghost"
            className="py-1 px-2"
            icon={Check}
            iconSize={14}
            accessibilityLabel={isAllSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
          />
        </View>

        <Card>
          {recipients.map((recipient, index) => (
            <RecipientItem
              key={recipient.id}
              name={recipient.name}
              isSelected={isSelected(recipient.id)}
              isLast={index === recipients.length - 1}
              onPress={() => toggle(recipient.id)}
            />
          ))}
        </Card>
      </View>

      {/* Área de texto del mensaje. */}
      <View className="px-6 pt-4">
        <Text className="text-slate-700 text-sm font-semibold mb-2">
          Mensaje
        </Text>
        <Card>
          <TextInput
            className="text-slate-900 text-sm min-h-[120px]"
            placeholder="Escribe tu mensaje para los padres de familia..."
            placeholderTextColor="#94a3b8"
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            maxLength={MAX_MESSAGE_LENGTH}
            accessibilityLabel="Campo de mensaje"
            paddingVertical={0}
          />
          <View className="flex-row justify-end mt-2 pt-2 border-t border-slate-100">
            <Text className="text-slate-400 text-xs">
              {message.length}/{MAX_MESSAGE_LENGTH}
            </Text>
          </View>
        </Card>
      </View>

      {/* Espaciador para que el contenido no quede bajo el botón fijo. */}
      <View className="h-24" />
    </Screen>
  );
};

// Mock de destinatarios.
const recipients = [
  { id: 1, name: 'Sra. García (madre de Ana)' },
  { id: 2, name: 'Sr. Mendoza (padre de Carlos)' },
  { id: 3, name: 'Sra. Ruiz (madre de Daniela)' },
  { id: 4, name: 'Sr. Fernández (padre de Diego)' },
  { id: 5, name: 'Sra. Torres (madre de Emiliano)' },
];

export default SendMessageScreen;
