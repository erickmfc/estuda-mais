import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import { useSession } from '../auth/SessionProvider';

export default function ActivityPressable({ onPress, onPressIn, ...props }) {
  const { registerActivity } = useSession();
  const handlePress = useCallback((...args) => {
    registerActivity();
    onPress?.(...args);
  }, [onPress, registerActivity]);
  const handlePressIn = useCallback((...args) => {
    registerActivity();
    onPressIn?.(...args);
  }, [onPressIn, registerActivity]);

  return <Pressable {...props} onPressIn={handlePressIn} onPress={handlePress} />;
}
