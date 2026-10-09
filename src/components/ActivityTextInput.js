import React from 'react';
import { TextInput } from 'react-native';
import { useSession } from '../auth/SessionProvider';

export default function ActivityTextInput({ onChangeText, ...props }) {
  const { registerActivity } = useSession();
  return (
    <TextInput
      {...props}
      onChangeText={(value) => {
        registerActivity();
        onChangeText?.(value);
      }}
    />
  );
}
