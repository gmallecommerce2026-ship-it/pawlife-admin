import { View, Text, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/contexts/useAppTheme';
import { useLanguage } from '@/contexts/LanguageContext';

type Mode = 'light' | 'dark' | 'system';

export const ThemeSwitchRow = () => {
  const { setMode, isDark } = useAppTheme();
  const { t } = useLanguage();

  const options: { key: Mode; label: string }[] = [
    { key: 'light', label: t('Light') },
    { key: 'dark', label: t('Dark') },
    { key: 'system', label: t('System') },
  ];

  return (
    <View className="px-4 py-3">
      <Text className="mb-2 text-gray-900 dark:text-zinc-100 font-semibold">
        {t('Appearance')}
      </Text>
      <View className="flex-row rounded-xl bg-gray-100 dark:bg-zinc-800 p-1">
        {options.map((o) => (
          <TouchableOpacity
            key={o.key}
            onPress={() => setMode(o.key)}
            className="flex-1 items-center rounded-lg py-2"
          >
            <Text className="text-gray-700 dark:text-zinc-300">{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};