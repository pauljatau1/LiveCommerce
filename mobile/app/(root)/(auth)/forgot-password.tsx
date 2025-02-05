import { View, Text } from 'react-native'
import React from 'react'
import { FocusAwareStatusBar } from '@/components/ui/focus-aware-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import ForgotPassword from '@/components/auth/forgot-password'

const ForgotPasswordPage = () => {
    return (
        <>
            <FocusAwareStatusBar barStyle="light-content" backgroundColor='black' />
            <SafeAreaView>
                <ForgotPassword />
            </SafeAreaView>
        </>
    )
}

export default ForgotPasswordPage
