import React, { useState, useEffect } from 'react'
import SlidePanel from '../Panels/SlidePanel'
import SettingsContent from './SettingsContent'

const Setting = ({open , onClose , ProfileData}) => {

    return (
        <SlidePanel
            open={open}
            onClose={onClose}
            title='Settings'
        >
            <SettingsContent/>
        </SlidePanel>
    )
}

export default Setting