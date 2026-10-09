import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSession } from '../auth/SessionProvider';

export default function ActivityTouchableOpacity({ onPress, onPressIn, ...props }) {
  const { registerActivity } = useSession();
  const handlePress = useCallback((...args) => {
    registerActivity();
    onPress?.(...args);
  }, [onPress, registerActivity]);
  const handlePressIn = useCallback((...args) => {
    registerActivity();
    onPressIn?.(...args);
  }, [onPressIn, registerActivity]);

  return <TouchableOpacity {...props} onPressIn={handlePressIn} onPress={handlePress} />;
}
