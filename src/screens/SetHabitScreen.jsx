import React, { useCallback, useRef } from 'react'
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native'
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import uuid from 'react-native-uuid';
import { useDispatch, useSelector } from 'react-redux';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Label, ColorPicker } from "styles/crudtask"
import { BaseView, LineItemView, Modal, BasePressButton, LineItemOptions, STHeader } from '@components';
import { HABIT_COLORS, convertTo12HourFormat, getRandomItem, getTimeFromTimestamp, uses24HourClock } from '@constants';
import { habitsActions } from "actions";
import { habitSelectors } from '@redux';
import alert from '../polyfils/alert';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useCurrentTheme, useInputFocusOnInit } from 'hooks';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_TIME = "11:00"

const SetHabitScreen = React.memo(({ route, navigation, isEdit }) => {
  const focusInputRef = useRef(null);
  const { t } = useTranslation();
  const d = useDispatch();

  const initialState = {
    color: getRandomItem(HABIT_COLORS),
    name: "",
    notification: "",
    remind: false,
    repeat: "every-day"
  }

  const [state, setState] = React.useState({ ...initialState });
  const [isColorPicker, setColorPicker] = React.useState(false);
  const [isSelectTime, setSelectTime] = React.useState(false);
  const [themeColors] = useCurrentTheme();
  
  const items = useSelector(habitSelectors.selectItems);

  const androidTimeSelected = state.remindTime && Platform.OS === "android";

  const onChangeInput = useCallback((name, value) => {
    if (name && value !== undefined) {

      // case "remind, remindTime" part. if enabled and no prev value = set 12, else null
      if (name === "remind") {
        let remindTime = state?.remindTime ? state.remindTime : DEFAULT_TIME
        if (!value) remindTime = null;
        setState({ ...state, [name]: value, remindTime })
      }

      // else default case
      else setState({ ...state, [name]: value })
    }
  }, [state]);


  const onSubmitCheckName = useCallback((name) => {
    return !!items.find(e => e.name === name)
  }, [items])

  const onSubmit = useCallback(() => {
    if (isEdit) {
      d(habitsActions.updateHabit({...state}));
      navigation.navigate('home')
    }
    else {
      if (false && onSubmitCheckName(state.name)) {
        alert(
          `Habit with provided name already exist.`,
          "",
          [
            {
              text: 'Ok',
              style: 'Ok',
            },
          ])
      }
      else {
        // ~35ms vs 65ms in assign benchmark
        const cleanObj = Object.create(null);
        Object.assign(cleanObj, state);
        Object.assign(cleanObj, { id: uuid.v4(), datesArray: [] });
        d(habitsActions.addHabit(cleanObj));
        // d(habitsActions.addHabit({ id: uuid.v4(), ...state, datesArray: [] }));
        setState(initialState);
        navigation.navigate('home')
      }
    }
  })

  const navigateToSetRepeat = () => {
    navigation.navigate('sethabit/repeat', {
      state,
      onGoBack: ({ data }) => {
        // Callback function to handle data from ScreenB
        setState(data);
      },
    });
  }

  !isEdit && useInputFocusOnInit(focusInputRef);

  React.useEffect(() => {
    // sets params from route
    if (route?.params && isEdit)
      setState({ ...state, ...route.params });
  }, [route.params])


  const styles = StyleSheet.create({
    combinedInput: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      marginTop: 7,
      marginBottom: 14,
      backgroundColor: themeColors.bgHighlight,
      border: `1px solid ${themeColors.borderColor}`,
      borderWidth: 1,
      borderColor: `${themeColors.borderColor}`,
      borderLeftColor: "transparent",
      borderRightColor: "transparent"
    },
    settingsInput: {
      height: 58,
      marginTop: 7,
      marginBottom: 14,
      backgroundColor: themeColors.bgHighlight,
      paddingVertical: 12,
      paddingLeft: 15,
      paddingRight: 10,
      borderRadius: 0,
      fontSize: 17,
      color: themeColors.textColorHighlight,
      // border: `1px solid ${themeColors.borderColor}`,
      borderWidth: 1,
      borderColor: `${themeColors.borderColor}`,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",

    },
    settingsInputEmbeded: {
      flex: 1,
      marginTop: 0,
      marginBottom: 0,
      border: "none",
    }
  });

  const ModalContent = styled.View`
  width: 300px;
  background:${themeColors.bgHighlight};
  color: ${themeColors.textColorHighlight};
  padding: 20px;
  border-radius: 10px;
`

const twelveOr24Time = useCallback((time) => {
  if(uses24HourClock(new Date())) return time;
  return convertTo12HourFormat(time);
}, [])

  return (
    <BaseView>
      <STHeader
        title={isEdit ? t("eddt_screen") : t("addt_screen")}

        leftText={t("act_cancel")}
        rightPress={state.name?.length ? onSubmit : null}
        rightText={t("act_save")}
        bgColor={state.color}

        navigation={navigation}
      />


      {/* color picker & input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          overScrollMode='always'
          ref={ref => { this.scrollView = ref }}
          onContentSizeChange={() => state.remind && this.scrollView.scrollToEnd({ animated: true })}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps={'handled'}
          style={{ paddingTop: 14, flex: 1 }}>
          <Label>{t("addt_name")}</Label>
          <View style={styles.combinedInput}>
            <TextInput
              keyboardAppearance={themeColors.label}
              ref={focusInputRef}
              style={[styles.settingsInput, styles.settingsInputEmbeded, { borderWidth: 0 }]}
              onChangeText={(v) => onChangeInput("name", v)}
              value={state.name}
              placeholder={t("addt_name_placeholder")}
              placeholderTextColor="#9ba2a7"
            />
            <BasePressButton
              onPress={() => setColorPicker(true)}
              styleObj={{
                maxWidth: 40,
                width: 40,
                height: 40,
                borderRadius: 50,
                paddingVertical: 0,
                paddingHorizontal: 0,
                marginHorizontal: 10,
                marginRight: 15,
                marginBottom: 0
              }}
              title=" "
              backgroundColor={state.color}
            />
          </View>


          <Modal isOpen={isColorPicker} transparent>
          <TouchableWithoutFeedback onPress={() => setColorPicker(false)}>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <SafeAreaView>
                <ModalContent>
                  <ColorPicker>
                    {HABIT_COLORS.map(color =>
                      <BasePressButton
                        key={`key_pressbtn_${color}`}
                        onPress={() => { onChangeInput("color", color); setColorPicker(false); }}
                        styleObj={{
                          width: 74,
                          height: 74,
                          borderRadius: 50,
                          paddingVertical: 0,
                          paddingHorizontal: 0,
                        }}
                        title=" "
                        backgroundColor={color}
                      />)}
                  </ColorPicker>
                </ModalContent>
                </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

          {/* color picker end */}

          <Label>{t("addt_notif")}</Label>
          <TextInput
            keyboardAppearance={themeColors.label}
            style={styles.settingsInput}
            onChangeText={(v) => onChangeInput("notification", v)}
            value={state.notification}
            placeholder={t("addt_notif_placeholder")}
            placeholderTextColor="#9ba2a7"
          />

          


          <Label style={{ marginBottom: 7 }}>{t("label_reg")}</Label>
          <LineItemOptions
            onPress={navigateToSetRepeat}
            title={t("addt_repeat")}
            value={t(state.repeat)} />

          {/* TODO: Web support */}
          {Platform.OS === "ios" || Platform.OS === "android"
            ? <LineItemView 
                pl1 
                toggle 
                toggleColor={state.color} 
                isEnabled={state.remind} 
                onPress={() => {onChangeInput("remind", true); setSelectTime(true)}}
                onToggle={(v) => { onChangeInput("remind", v); setSelectTime(v) }}>
                <Text style={{ fontSize: 17, color: themeColors.textColorHighlight, flex: 1 }}>{t("addt_remind")}</Text>
                {androidTimeSelected
               ? <Text style={{ fontSize: 17, color: themeColors.chevronText, marginRight: 10 }}>{twelveOr24Time(state.remindTime)}</Text>
                :  null}
              </LineItemView>
            : null}

          {state.remind 
          ? <SelectDate
                remind={state.remind}
                themeColors={themeColors}
                value={state?.remindTime}
                isSelectTime={isSelectTime}
                setSelectTime={setSelectTime}
                onChangeInput={onChangeInput} />
          : null}
      
            

          <View style={{ paddingBottom: 20 }} />
        </ScrollView>

      </KeyboardAvoidingView>
    </BaseView>
  )
});



const SelectDate = ({ themeColors, value, onChangeInput, remind, isSelectTime, setSelectTime }) => {  
  const date = new Date();
  const {t} = useTranslation();

  const onTimeSelect = (_, payload) => {
    if(Platform.OS === "android") {
      setSelectTime(false)
    }
    const time = getTimeFromTimestamp(payload);
    if (time) {
      onChangeInput("remindTime", time);
    }
  }

  const height = useSharedValue(220);

  const animatedProps = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden'
  }));

  React.useEffect(() => {
    const value = remind ? 220 : 0
    height.value = withTiming(value, {duration: 300})
  }, [remind])

  return (
    <Animated.View style={animatedProps}>
      {isSelectTime
        ? <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)}>
          <RNDateTimePicker
            style={{ backgroundColor: themeColors.bgHighlight, background: "red" }}
            positiveButton={{label: 'OK', textColor: themeColors.textColor}} 
            negativeButton={{label: t("act_cancel"), textColor: themeColors.textColor}} 
            is24Hour={uses24HourClock(date)}
            themeVariant={themeColors.label}
            onChange={onTimeSelect}
            timeZoneName={'GMT0'}
            value={new Date("2024-09-16T" + (value ? value + ":00.000Z" : `${DEFAULT_TIME}:00.000Z`))}
            mode="time"
            display="spinner"
          />

        </Animated.View>
        : null}
    </Animated.View>
  )
}


export default SetHabitScreen