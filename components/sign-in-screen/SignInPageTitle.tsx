import { Text, View } from 'react-native';
import { styles } from '../../styles/SignInStyles';

export function PageTitle() {
  return (
    <View style={styles.pageTitleContainer}>
      <Text style={styles.pageTitle}>Splend</Text>
      <Text style={styles.subtitle}>Have a plan? Splend it!</Text>
    </View>
  );
}