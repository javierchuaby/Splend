import { Text, View } from 'react-native';
import { styles } from '../styles/SignUpStyles';

export function SignUpPageTitle() {
  return (
    <View style={styles.pageTitleContainer}>
      <Text style={styles.pageTitle}>Create Account</Text>
      <Text style={styles.subtitle}>Join Splend and start planning!</Text>
    </View>
  );
}