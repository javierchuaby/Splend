import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#305cde',
      tabBarInactiveTintColor: '#fff',
      tabBarStyle: {
          backgroundColor: '#1e1e1e',     // <-- Set this to match your page background
          borderTopWidth: 0,              // Optional: removes the top border for a cleaner look
        },
      }}>
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome name="calendar" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          href: null, // This hides the trips folder from the tab bar
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          href: null, // This hides the members folder from the tab bar
        }}
      />
    </Tabs>
  );
}