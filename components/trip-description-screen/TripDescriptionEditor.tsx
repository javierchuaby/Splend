import React from 'react';
import { TextInput } from 'react-native';
import { TripDescriptionScreenStyles as styles } from '../../styles/TripDescriptionScreenStyles';

interface TripDescriptionEditorProps {
  description: string;
  onChangeText: (text: string) => void;
}

export const TripDescriptionEditor: React.FC<TripDescriptionEditorProps> = ({
  description,
  onChangeText,
}) => {
  return (
    <TextInput
      style={styles.textArea}
      value={description}
      onChangeText={onChangeText}
      placeholder="No description provided."
      placeholderTextColor={styles.descriptionDisplay.color} // Using color from styles
      keyboardAppearance="dark"
      multiline={true}
      autoFocus={true}
    />
  );
};