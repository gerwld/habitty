import React, { useCallback } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next';

import { BaseView, SelectList, SettingsHeader } from '@components';
import { REPEAT_MASKS } from '@constants';

const AHSRepeat = ({ route, navigation }) => {
  const { t } = useTranslation();

  const [state, setState] = React.useState({
    ...route.params.state
  });
  const theme = route.params.theme
  

  const onChangeInput = useCallback((name, value) => {
    if (name && value !== undefined) {
      setState({ ...state, [name]: value })
    }
  }, [])

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      if (route.params?.onGoBack) {
        route.params.onGoBack({ data: { ...state } });
      }
      navigation.dispatch(e.data.action);
    });

    return unsubscribe;
  }, [navigation, route.params, state]);

  React.useEffect(() => {
    setState({ ...state, ...route.params.state });
  }, [route.params])

  return (

    <BaseView>
      <SettingsHeader
        bgColor={state.color}
        navigation={navigation}
        theme={theme}
        title={t("addt_int_title")}
      />

      <View style={{ paddingTop: 14, flex: 1 }}>
        <SelectList
          theme={theme}
          style={{ flex: 1 }}
          currentValue={state.repeat}
          color={state.color}
          setValue={(v) => onChangeInput('repeat', v)}
          data={Object.keys(REPEAT_MASKS).map(e => ({ name: REPEAT_MASKS[e], value: e }))}
          title={t('label_reg')}
        />
      </View>


    </BaseView>
  )
}

export default AHSRepeat