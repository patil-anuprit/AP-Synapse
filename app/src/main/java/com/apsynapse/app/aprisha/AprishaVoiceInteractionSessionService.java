package com.apsynapse.app.aprisha;

import android.os.Bundle;
import android.service.voice.VoiceInteractionSession;
import android.service.voice.VoiceInteractionSessionService;

public final class AprishaVoiceInteractionSessionService
        extends VoiceInteractionSessionService {

    @Override
    public VoiceInteractionSession onNewSession(
            Bundle args
    ) {

        return new AprishaVoiceInteractionSession(
                this
        );
    }
}