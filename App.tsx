import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from './src/theme';
import Home from './src/screens/Home';
import Listen from './src/screens/Listen';
import Practice from './src/screens/Practice';
import MixUp from './src/screens/MixUp';
import { Ragas, RagaDetail, Compare } from './src/screens/Ragas';
import { Composers, ComposerDetail, SongDetail } from './src/screens/Composers';

const theme = { ...DefaultTheme, dark: true, colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, text: colors.text, border: colors.border, primary: colors.gold } };
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const icon = (g: string) => ({ color }: any) => <Text style={{ color, fontSize: 18 }}>{g}</Text>;

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, tabBarActiveTintColor: colors.gold, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border } }}>
      <Tab.Screen name="Home" component={Home} options={{ tabBarIcon: icon('✦'), headerShown: false }} />
      <Tab.Screen name="Ragas" component={Ragas} options={{ tabBarIcon: icon('♪') }} />
      <Tab.Screen name="Composers" component={Composers} options={{ tabBarIcon: icon('❖') }} />
      <Tab.Screen name="Listen" component={Listen} options={{ tabBarIcon: icon('◉'), title: 'Sing' }} />
      <Tab.Screen name="Practice" component={Practice} options={{ tabBarIcon: icon('♫'), title: 'Practice' }} />
      <Tab.Screen name="MixUp" component={MixUp} options={{ tabBarIcon: icon('⟡'), title: 'Mix up' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, headerTitle: '' }}>
        <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="RagaDetail" component={RagaDetail} />
        <Stack.Screen name="Compare" component={Compare} />
        <Stack.Screen name="ComposerDetail" component={ComposerDetail} />
        <Stack.Screen name="SongDetail" component={SongDetail} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
