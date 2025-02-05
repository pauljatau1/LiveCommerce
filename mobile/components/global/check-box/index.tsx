import React, { useEffect, useState } from 'react';
import Checkbox from 'expo-checkbox';
import { useController } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

type CheckBoxProps = {
    label: string;
    name: string;
    required?: boolean;
    textStyle?: string;
};

const CheckBox = ({ label, name, textStyle = '', required = false }: CheckBoxProps) => {
    const {
        field: { value, onChange },
    } = useController({ name, rules: { required } });

    const [isChecked, setIsChecked] = useState(!!value);

    useEffect(() => {
        setIsChecked(value);
    }, [value]);

    return (
        <View style={styles.container}>
            <Checkbox
                value={isChecked}
                onValueChange={(newValue) => {
                    setIsChecked(newValue);
                    onChange(newValue);
                }}
                color={isChecked ? '#888787' : undefined}
            />
            <Text style={[styles.label, textStyle && { fontFamily: textStyle }]}>
                {label}
            </Text>
        </View>
    );
};

export default CheckBox;

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    label: { fontSize: 14, color: '#888787' },
});
